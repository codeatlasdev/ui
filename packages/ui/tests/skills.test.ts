import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";

/**
 * Mirrors the discovery rules of the `skills` CLI (vercel-labs/skills, src/skills.ts):
 * - a SKILL.md at the root of a container dir (`.agents/skills/`) makes the CLI treat the whole
 *   directory as ONE skill and return early, so its sub-skills are never listed;
 * - every SKILL.md needs YAML frontmatter that parses, with string `name` and `description`
 *   (a parse error silently skips the skill, e.g. an unquoted `description: Use when: x`).
 */
const SKILLS = resolve(import.meta.dir, "../../../.agents/skills");
const EXPECTED = ["codeatlas-dx", "codeatlas-ui", "codeatlas-writing"];

function frontmatter(file: string): Record<string, unknown> {
	const m = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n/);
	if (!m) throw new Error(`${file}: no frontmatter`);
	return Bun.YAML.parse(m[1]) as Record<string, unknown>;
}

const dirs = readdirSync(SKILLS, { withFileTypes: true }).filter((e) => e.isDirectory());

describe("agent skills layout (npx skills add codeatlasdev/ui)", () => {
	it("has no SKILL.md at the container root (the CLI would stop at it)", () => {
		expect(existsSync(join(SKILLS, "SKILL.md"))).toBe(false);
	});

	it("exposes exactly codeatlas-ui, codeatlas-dx and codeatlas-writing", () => {
		const names = dirs
			.filter((d) => existsSync(join(SKILLS, d.name, "SKILL.md")))
			.map((d) => frontmatter(join(SKILLS, d.name, "SKILL.md")).name);
		expect(names.sort()).toEqual(EXPECTED);
	});

	it("names every folder after its `name:` frontmatter", () => {
		for (const d of dirs) {
			const file = join(SKILLS, d.name, "SKILL.md");
			if (existsSync(file)) expect(frontmatter(file).name).toBe(d.name);
		}
	});

	it("has string name and description in every SKILL.md", () => {
		for (const d of dirs) {
			const file = join(SKILLS, d.name, "SKILL.md");
			if (!existsSync(file)) continue;
			const fm = frontmatter(file);
			expect(typeof fm.name).toBe("string");
			expect(typeof fm.description).toBe("string");
		}
	});
});

describe("codeatlas-ui APPSHELL.md", () => {
	const doc = readFileSync(join(SKILLS, "codeatlas-ui/APPSHELL.md"), "utf8");
	const block = doc.match(/```ts\n([\s\S]*?)```/)?.[1] ?? "";

	it("type-checks its NavModule example against the published types", () => {
		const root = resolve(import.meta.dir, "..");
		const types = join(root, "src/lib/components/AppShell/types.ts");
		// `@codeatlasdev/ui` resolves to the AppShell types; the icon package stays a stub.
		const icons = (block.match(/import \{([^}]*)\} from '@lucide\/svelte';/)?.[1] ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const source = block
			.replace("'@codeatlasdev/ui'", `'${types.replace(/\.ts$/, "")}'`)
			.replace(/import \{[^}]*\} from '@lucide\/svelte';/, "")
			.concat(
				`\ndeclare const ${icons.map((i) => `${i}: NavModule['icon']`).join(", ")};\nexport {};\n`
			);
		const file = join(root, "__appshell_doc__.ts");
		const host = ts.createCompilerHost({});
		const read = host.readFile.bind(host);
		host.readFile = (f) => (f === file ? source : read(f));
		const fileExists = host.fileExists.bind(host);
		host.fileExists = (f) => f === file || fileExists(f);
		const getSource = host.getSourceFile.bind(host);
		host.getSourceFile = (f, lang, ...rest) =>
			f === file ? ts.createSourceFile(f, source, lang, true) : getSource(f, lang, ...rest);
		const program = ts.createProgram(
			[file],
			{
				strict: true,
				noEmit: true,
				skipLibCheck: true,
				allowImportingTsExtensions: true,
				moduleResolution: ts.ModuleResolutionKind.Bundler,
				module: ts.ModuleKind.ESNext,
				target: ts.ScriptTarget.ESNext,
			},
			host
		);
		const errors = ts
			.getPreEmitDiagnostics(program, program.getSourceFile(file))
			.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
		expect(errors).toEqual([]);
	});

	it("uses basePath/items, never path/sections, on a module", () => {
		expect(block).toContain("basePath:");
		expect(block).not.toMatch(/sections\s*:/);
	});
});

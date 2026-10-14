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

/** Forward slashes: the compiler host sees them on every OS, and `\` would escape in a TS string. */
const posix = (path: string) => path.replaceAll("\\", "/");

/** Type-check `source` as a virtual file inside packages/ui (strict, so imports resolve like the repo's). */
function typeErrors(name: string, source: string): string[] {
	const file = posix(join(resolve(import.meta.dir, ".."), name));
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
	return ts
		.getPreEmitDiagnostics(program, program.getSourceFile(file))
		.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

describe("codeatlas-ui APPSHELL.md", () => {
	const doc = readFileSync(join(SKILLS, "codeatlas-ui/APPSHELL.md"), "utf8");
	const block = doc.match(/```ts\n([\s\S]*?)```/)?.[1] ?? "";

	it("type-checks its NavModule example against the published types", () => {
		const root = resolve(import.meta.dir, "..");
		const types = posix(join(root, "src/lib/components/AppShell/types.ts"));
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
		expect(typeErrors("__appshell_doc__.ts", source)).toEqual([]);
	});

	it("uses basePath/items, never path/sections, on a module", () => {
		expect(block).toContain("basePath:");
		expect(block).not.toMatch(/sections\s*:/);
	});
});

describe("codeatlas-ui SKILL.md", () => {
	const doc = readFileSync(join(SKILLS, "codeatlas-ui/SKILL.md"), "utf8");
	const blocks = [...doc.matchAll(/```(\w+)\n([\s\S]*?)```/g)].map((m) => ({
		lang: m[1],
		code: m[2],
	}));
	const viteBlock =
		blocks.find((b) => b.lang === "ts" && b.code.includes("caThemePlugin"))?.code ?? "";

	it("passes the shared theme to caThemePlugin and caThemeHandle in the setup block", () => {
		// Agents copy this block, so a bare caThemePlugin()/caThemeHandle() ships the default brand.
		expect(viteBlock).toMatch(/caThemePlugin\(theme\)/);
		expect(viteBlock).toMatch(/caThemeHandle\(theme\)/);
		expect(viteBlock).not.toMatch(/caTheme(?:Plugin|Handle)\(\s*\)/);
	});

	it("type-checks the theme object against ThemeOptions and the plugin/handle signatures", () => {
		const themeFile = viteBlock.match(/\/\/ src\/lib\/theme\.ts[\s\S]*?\n\};\n/)?.[0] ?? "";
		expect(themeFile).toContain("ThemeOptions");
		const lib = posix(join(resolve(import.meta.dir, ".."), "src/lib"));
		const source = `${themeFile.replace("'@codeatlasdev/ui'", `'${lib}/theme-script.ts'`)}
import { caThemePlugin } from '${lib}/vite-plugin.ts';
import { caThemeHandle } from '${lib}/kit/theme-handle.ts';
caThemePlugin(theme);
caThemeHandle(theme);
`;
		expect(typeErrors("__skill_setup__.ts", source)).toEqual([]);
		// The check bites: a typo'd option must be reported.
		const bad = source.replace("defaultScheme:", "defaultSchemeX:");
		expect(typeErrors("__skill_setup__.ts", bad)).not.toEqual([]);
	}, 60_000);

	it("imports the theme with the .ts extension (Vite native config loader)", () => {
		expect(viteBlock).toMatch(/import \{ theme \} from ['"]\.\/src\/lib\/theme\.ts['"]/);
	});

	it("mentions every export of @codeatlasdev/ui/actions", () => {
		const barrel = readFileSync(resolve(import.meta.dir, "../src/lib/actions/index.ts"), "utf8");
		const exports = [...barrel.matchAll(/export \{([^}]*)\}/g)]
			.flatMap((m) => m[1].split(","))
			.map((s) => s.trim())
			.filter(Boolean);
		expect(exports).toContain("primeKeyboard");
		const missing = exports.filter((name) => !new RegExp(`\\b${name}\\b`).test(doc));
		expect(missing).toEqual([]);
	});
});

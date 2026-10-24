import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CODEMOD_IDS, migrate } from "../src/cli/migrate.ts";
import {
	checkChangelog,
	checkChangeset,
	loadMigrations,
	migrationMarkdown,
	migrationsBetween,
} from "../src/cli/migrations.ts";
import { cleanTmp, tmpDir } from "./tmp";

afterAll(cleanTmp);

const ROOT = join(import.meta.dir, "../../..");
const all = loadMigrations();
const entries = all.flatMap((m) => m.entries);

describe("migration registry (#382)", () => {
	it("has one file per major from 1 to the current one, every entry well formed", () => {
		expect(all.map((m) => m.major)).toEqual([1, 2, 3, 4]);
		for (const e of entries) {
			expect(e.id, e.id).toMatch(/^v\d+-[a-z0-9-]+$/);
			expect(["rename", "removed", "behavior"], e.id).toContain(e.kind);
			expect(["yes", "partial", "no"], e.id).toContain(e.codemod);
			expect(e.note.length, e.id).toBeGreaterThan(10);
			if (e.detect) expect(() => new RegExp(e.detect as string), e.id).not.toThrow();
		}
		expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
		for (const m of all)
			for (const e of m.entries) expect(e.id.startsWith(`v${m.major}-`)).toBe(true);
	});

	it("lists the known breaking changes with the codemod verdict", () => {
		const by = (id: string) => entries.find((e) => e.id === id);
		expect(by("v3-grid-columns")?.codemod).toBe("partial");
		expect(by("v3-glasscard-to-card")?.codemod).toBe("yes");
		expect(by("v2-modal-overlay-dialog")?.codemod).toBe("no");
		expect(by("v4-selectable-class")?.codemod).toBe("yes");
		expect(by("v2-setlocale-i18nprovider")?.codemod).toBe("partial");
		expect(by("v1-brandpreset-presetdefinition")?.codemod).toBe("yes");
	});

	it("never claims a codemod that migrate does not implement", () => {
		for (const e of entries.filter((x) => x.codemod !== "no"))
			expect(CODEMOD_IDS, e.id).toContain(e.codemodId ?? "");
		for (const e of entries.filter((x) => x.codemod === "no"))
			expect(e.codemodId, e.id).toBeUndefined();
	});

	it("picks the majors in (from, to]", () => {
		expect(migrationsBetween(2, 4).map((m) => m.major)).toEqual([3, 4]);
		expect(migrationsBetween(0, 1).map((m) => m.major)).toEqual([1]);
		expect(migrationsBetween(4, 4)).toEqual([]);
	});

	it("renders MIGRATION.md with before -> after, why and the codemod flag, and the committed file is current", () => {
		const md = migrationMarkdown(all);
		expect(md).toContain("## 3.0.0");
		expect(md).toContain("`v3-grid-columns`");
		expect(md).toContain("**migrate**: partial");
		expect(readFileSync(join(ROOT, "packages/ui/MIGRATION.md"), "utf8")).toBe(md);
	});
});

describe("release policy (#382)", () => {
	it("a major changeset must cite a migration id that exists", () => {
		const ids = new Set(entries.map((e) => e.id));
		const base = '---\n"@codeatlasdev/ui": major\n---\n\n';
		expect(checkChangeset(`${base}Renames X.`, ids)).toContain("Migration:");
		expect(checkChangeset(`${base}Renames X.\n\nMigration: v9-nope`, ids)).toContain("v9-nope");
		expect(checkChangeset(`${base}Renames X.\n\nMigration: v3-grid-columns`, ids)).toBeUndefined();
		expect(checkChangeset('---\n"@codeatlasdev/ui": minor\n---\n\nAdds Y.', ids)).toBeUndefined();
	});

	it("every pending changeset in .changeset/ passes the policy", () => {
		const dir = join(ROOT, ".changeset");
		const ids = new Set(entries.map((e) => e.id));
		const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md");
		expect(files.length).toBeGreaterThan(0);
		for (const f of files)
			expect(checkChangeset(readFileSync(join(dir, f), "utf8"), ids), f).toBeUndefined();
	});

	it("every breaking line of a released major links a migration id", () => {
		const log = readFileSync(join(ROOT, "packages/ui/CHANGELOG.md"), "utf8");
		expect(checkChangelog(log, all)).toEqual([]);
		expect(checkChangelog("## 9.0.0\n\n### Major Changes\n\n- abc1234: Breaks.\n", all)).toEqual([
			"9.0.0: major change without a Migration id (abc1234)",
		]);
		// An explicit `Migration: id` in the bullet counts, as long as the id exists.
		expect(
			checkChangelog(
				"## 9.0.0\n\n### Major Changes\n\n- abc1234: Breaks.\n\n  Migration: v3-grid-columns\n",
				all
			)
		).toEqual([]);
	});
});

function project(files: Record<string, string>): string {
	const dir = tmpDir("ca-mig-");
	for (const [p, c] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, p)), { recursive: true });
		writeFileSync(join(dir, p), c);
	}
	return dir;
}

/** Fixture app from the issue: Grid `cols`, `setLocale`, GlassCard, a `.selectable` region, bits-ui. */
const APP = {
	"src/routes/+layout.svelte": `<script lang="ts">
	import { setLocale } from "@codeatlasdev/ui";
	setLocale("pt-BR");
</script>
<slot />
`,
	"src/routes/+page.svelte": `<script lang="ts">
	import { Grid, GlassCard } from "@codeatlasdev/ui";
</script>
<Grid cols={3} gap={16}><GlassCard thickness="thick">a</GlassCard></Grid>
<Grid cols="2fr 1fr" gap={8}><p>b</p></Grid>
<div class="selectable">copy me</div>
`,
	"src/app.css": `.selectable { user-select: text }\ndialog.ca-overlay { color: red }\n.ca-overlay { padding: 0 }\n`,
	"src/lib/pick.ts": `import { Select } from "bits-ui";\n`,
};

function run(opts: Parameters<typeof migrate>[1] = {}, files: Record<string, string> = APP) {
	const dir = project(files);
	const lines: string[] = [];
	const ok = migrate(
		Object.keys(files).map((f) => join(dir, f)),
		{ cwd: dir, write: true, log: (l) => lines.push(l), ...opts }
	);
	return {
		dir,
		ok,
		out: lines.join("\n"),
		read: (f: string) => readFileSync(join(dir, f), "utf8"),
	};
}

describe("migrate --from --to (#382)", () => {
	it("2 -> 4 rewrites Grid, GlassCard and .selectable and reports what it did not touch", () => {
		const r = run({ from: 2, to: 4, report: "json" });
		const page = r.read("src/routes/+page.svelte");
		expect(page).toContain('<Grid columns={3} gap="4">');
		expect(page).toContain('<Card material="glass" elevation={4}>');
		expect(page).toContain('class="ca-selectable"');
		expect(r.read("src/app.css")).toContain(".ca-selectable { user-select: text }");
		const report = JSON.parse(r.out);
		expect(report.from).toBe(2);
		expect(report.to).toBe(4);
		expect(report.changed.length).toBeGreaterThan(0);
		// The template-string Grid is left, with file:line; v2 (.ca-overlay) is outside (2, 4].
		const left = report.left.map(
			(l: { id: string; file: string; line: number }) => `${l.id} ${l.file}:${l.line}`
		);
		expect(left).toContain("v3-grid-columns src/routes/+page.svelte:5");
		expect(left.some((l: string) => l.startsWith("v2-"))).toBe(false);
	});

	it("1 -> 4 also locates the .ca-overlay selectors and the bits-ui import", () => {
		const left = JSON.parse(run({ from: 1, to: 4, report: "json" }).out).left.map(
			(l: { id: string; file: string; line: number }) => `${l.id} ${l.file}:${l.line}`
		);
		expect(left).toContain("v2-modal-overlay-dialog src/app.css:3");
		expect(left).toContain("v2-bits-ui-dependency src/lib/pick.ts:1");
	});

	it("a project already on 3 does not get the 3.0 rewrites or reports", () => {
		const r = run({ from: 3, to: 4, report: "json" });
		expect(r.read("src/routes/+page.svelte")).toContain("<GlassCard");
		expect(r.read("src/routes/+page.svelte")).toContain('class="ca-selectable"');
		const report = JSON.parse(r.out);
		expect(report.left.some((l: { id: string }) => l.id.startsWith("v2-"))).toBe(false);
		expect(report.left.some((l: { id: string }) => l.id.startsWith("v3-"))).toBe(false);
	});

	it("flags setLocale for the 2.x SSR change instead of rewriting the layout", () => {
		const r = run({ from: 1, to: 2, report: "json" });
		const report = JSON.parse(r.out);
		expect(report.left).toContainEqual(
			expect.objectContaining({
				id: "v2-setlocale-i18nprovider",
				file: "src/routes/+layout.svelte",
				line: 3,
			})
		);
		expect(r.read("src/routes/+layout.svelte")).toContain('setLocale("pt-BR")');
	});

	it("1.0 renames NavModule path/sections to basePath/items and leaves NavItem alone (#383)", () => {
		const nav = `import type { NavModule } from "@codeatlasdev/ui";
import { Map } from "lucide-svelte";
export const modules: NavModule[] = [
	{ id: "map", label: "Map", icon: Map, path: "/map", sections: [{ items: [{ id: "a", label: "A", icon: Map, path: "/map/a" }] }] },
];
export const route = { path: "/x", sections: ["a"] };
`;
		const r = run({ from: 0, to: 1, report: "json" }, { "src/nav.ts": nav });
		const out = r.read("src/nav.ts");
		expect(out).toContain(`path: "/map/a"`);
		expect(out).toContain(`basePath: "/map"`);
		expect(out).toContain("items: [{ items:");
		expect(out).toContain(`{ path: "/x", sections: ["a"] }`);
		expect(JSON.parse(r.out).changed).toEqual(["src/nav.ts"]);
	});

	it("--strict exits false when something is left, true when nothing is", () => {
		expect(run({ from: 2, to: 4, strict: true }).ok).toBe(false);
		const clean = run(
			{ from: 2, to: 4, strict: true },
			{
				"src/a.svelte": `<script lang="ts">\n\timport { Stack } from "@codeatlasdev/ui";\n</script>\n<Stack gap={8}>x</Stack>\n`,
			}
		);
		expect(clean.ok).toBe(true);
	});

	it("never says a bare 'Nothing to migrate': it names what it checked", () => {
		const r = run({}, { "src/a.ts": "export const a = 1;\n" });
		expect(r.out).not.toContain("Nothing to migrate");
		expect(r.out).toContain("Nothing to rewrite: checked");
		expect(r.out).toContain("brand-preset-to-preset-definition");
		expect(run({ from: 2, to: 4 }, { "src/a.ts": "export {};\n" }).out).toContain("2 -> 4");
	});

	it("--report md prints a document with the three sections", () => {
		const md = run({ from: 1, to: 4, report: "md" }).out;
		expect(md).toContain("# Migration report 1 -> 4");
		expect(md).toContain("## Rewritten (");
		expect(md).toContain("## Left for you (");
		expect(md).toContain("`src/app.css:3` v2-modal-overlay-dialog");
	});

	it("a line carrying ca-ui-migrated(...) is not reported again", () => {
		const r = run(
			{ from: 1, to: 4, report: "json" },
			{
				"src/a.css":
					".ca-overlay { a: b } /* ca-ui-migrated(v2-modal-overlay-dialog) */\n.ca-overlay { c: d }\n",
			}
		);
		const left = JSON.parse(r.out).left.map((l: { line: number }) => l.line);
		expect(left).toEqual([2]);
	});

	it("without --write it only reports and leaves files byte-identical", () => {
		const r = run({ from: 2, to: 4, write: false });
		expect(r.read("src/routes/+page.svelte")).toBe(APP["src/routes/+page.svelte"]);
		expect(r.out).toContain("would change");
	});

	it("a .selectable rename leaves ca-selectable and other tokens alone", () => {
		const r = run(
			{ from: 3, to: 4 },
			{
				"src/a.svelte": `<div class="a selectable b"></div><div class="ca-selectable"></div><p class="unselectable"></p>\n<style>\n.selectable { a: b }\n.x .selectable * { a: b }\n.unselectable { a: b }\n</style>\n`,
			}
		);
		const out = r.read("src/a.svelte");
		expect(out).toContain('class="a ca-selectable b"');
		expect(out).toContain('class="ca-selectable"');
		expect(out).toContain('class="unselectable"');
		expect(out).toContain(".ca-selectable { a: b }");
		expect(out).toContain(".x .ca-selectable * { a: b }");
		expect(out).toContain(".unselectable { a: b }");
	});
});

describe("dev deprecation warnings cite a migration id (#382)", () => {
	const LIB = join(import.meta.dir, "../src/lib");
	const ids = new Set(entries.map((e) => e.id));
	const warns: [string, string, string][] = [
		["components/GlassCard/GlassCard.svelte", "glass-card", "v3-glasscard-to-card"],
		["components/GlassSurface/GlassSurface.svelte", "glass-surface", "v3-glasssurface-to-surface"],
		["components/Row/Row.svelte", "row", "v3-row-to-flex"],
		["i18n/state.svelte.ts", "set-locale", "v2-setlocale-i18nprovider"],
	];
	for (const [file, key, id] of warns)
		it(`${key} points at ${id}`, () => {
			const src = readFileSync(join(LIB, file), "utf8");
			expect(ids.has(id)).toBe(true);
			// The message is one string literal that may contain `);`, so read a fixed window from the call.
			const at = src.search(new RegExp(`devWarn\\(\\s*['"\`]${key}['"\`]`));
			const call = at < 0 ? "" : src.slice(at, at + 700);
			expect(call, `devWarn('${key}') in ${file}`).toContain(`migration ${id}`);
		});

	it("every `migration <id>` in a warning exists in the registry", () => {
		const cited: string[] = [];
		const walk = (dir: string) => {
			for (const e of readdirSync(dir, { withFileTypes: true })) {
				const path = join(dir, e.name);
				if (e.isDirectory()) walk(path);
				else if (/\.(svelte|ts)$/.test(e.name) && !/test/.test(e.name))
					for (const m of readFileSync(path, "utf8").matchAll(/migration (v\d+-[a-z0-9-]+)/g))
						cited.push(m[1]);
			}
		};
		walk(LIB);
		expect(cited.length).toBeGreaterThanOrEqual(warns.length);
		for (const id of cited) expect(ids.has(id), id).toBe(true);
	});
});

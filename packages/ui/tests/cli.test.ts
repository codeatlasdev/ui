import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { init } from "../src/cli/init.ts";
import { migrate } from "../src/cli/migrate.ts";

function project(files: Record<string, string>): string {
	const root = mkdtempSync(join(tmpdir(), "ca-cli-"));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), content);
	}
	return root;
}
const read = (root: string, path: string) => readFileSync(join(root, path), "utf8");
const quiet = { log: () => {} };

const KIT_PKG = JSON.stringify({ devDependencies: { "@sveltejs/kit": "^2.0.0" } });
const VITE = `import { sveltekit } from '@sveltejs/kit/vite';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n\tplugins: [sveltekit()]\n});\n`;
const APP_HTML = `<head>\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>`;

describe("init on SvelteKit", () => {
	it("creates the theme, hook and layout in an empty project", () => {
		const root = project({ "package.json": KIT_PKG });
		expect(init(root, quiet)).toBe(true);
		expect(read(root, "src/lib/theme.ts")).toContain("export const theme: ThemeOptions");
		expect(read(root, "src/hooks.server.ts")).toContain("caThemeHandle(theme)");
		expect(read(root, "src/hooks.server.ts")).toContain('from "$lib/theme"');
		expect(read(root, "src/routes/+layout.svelte")).toContain("colorScheme.init()");
	});

	it("uses the #lib import when the app declares it (Kit 3)", () => {
		const root = project({
			"package.json": JSON.stringify({
				devDependencies: { "@sveltejs/kit": "^3.0.0" },
				imports: { "#lib/*": "./src/lib/*" },
			}),
		});
		init(root, quiet);
		expect(read(root, "src/hooks.server.ts")).toContain('from "#lib/theme.ts"');
	});

	it("never overwrites existing files without --write, and leaves them byte-identical", () => {
		const root = project({
			"package.json": KIT_PKG,
			"vite.config.ts": VITE,
			"src/app.html": APP_HTML,
		});
		const lines: string[] = [];
		init(root, { log: (l) => lines.push(l) });
		expect(read(root, "vite.config.ts")).toBe(VITE);
		expect(read(root, "src/app.html")).toBe(APP_HTML);
		expect(lines.join("\n")).toMatch(/\+\s*caThemePlugin\(theme\)/);
	});

	it("patches existing files with --write and is idempotent", () => {
		const root = project({
			"package.json": KIT_PKG,
			"vite.config.ts": VITE,
			"src/app.html": APP_HTML,
		});
		init(root, { ...quiet, write: true });
		const vite = read(root, "vite.config.ts");
		expect(vite).toContain("plugins: [sveltekit(),\n\t\tcaThemePlugin(theme)\n\t]");
		expect(vite).toContain('import { caThemePlugin } from "@codeatlasdev/ui/vite";');
		expect(read(root, "src/app.html")).toContain("viewport-fit=cover");
		init(root, { ...quiet, write: true });
		expect(read(root, "vite.config.ts")).toBe(vite);
	});

	it("reports a hooks file that already defines handle instead of guessing", () => {
		const hooks = `export const handle = async ({ event, resolve }) => resolve(event);\n`;
		const root = project({ "package.json": KIT_PKG, "src/hooks.server.ts": hooks });
		expect(init(root, { ...quiet, write: true })).toBe(false);
		expect(read(root, "src/hooks.server.ts")).toBe(hooks);
	});

	it("keeps an existing layout's own imports and only adds what is missing", () => {
		const layout = `<script>\n\timport { onMount } from "svelte";\n\tlet { children } = $props();\n</script>\n{@render children()}\n`;
		const root = project({ "package.json": KIT_PKG, "src/routes/+layout.svelte": layout });
		init(root, { ...quiet, write: true });
		const out = read(root, "src/routes/+layout.svelte");
		expect(out.match(/import \{ onMount \}/g)).toHaveLength(1);
		expect(out).toContain("onMount(() => colorScheme.init())");
	});

	it("fails with a message outside a SvelteKit/Astro project", () => {
		const root = project({ "package.json": "{}" });
		expect(init(root, quiet)).toBe(false);
	});
});

describe("init on Astro", () => {
	const ASTRO_PKG = JSON.stringify({ dependencies: { astro: "^7.0.0" } });
	const CONFIG = `import svelte from "@astrojs/svelte";\nimport { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\tintegrations: [svelte()],\n});\n`;
	const LAYOUT = `---\n---\n<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><slot /></body></html>\n`;

	it("adds the integration, global.css, viewport and colorScheme.init to existing files", () => {
		const root = project({
			"package.json": ASTRO_PKG,
			"astro.config.mjs": CONFIG,
			"src/layouts/Base.astro": LAYOUT,
		});
		init(root, { ...quiet, write: true });
		expect(read(root, "astro.config.mjs")).toContain("integrations: [caUI(theme), svelte()]");
		expect(read(root, "src/theme.ts")).toContain('from "@codeatlasdev/ui/astro"');
		const layout = read(root, "src/layouts/Base.astro");
		expect(layout).toContain('import "@codeatlasdev/ui/styles/global.css"');
		expect(layout).toContain("viewport-fit=cover");
		expect(layout).toContain("colorScheme.init()");
	});

	it("creates a base layout when the project has none", () => {
		const root = project({ "package.json": ASTRO_PKG });
		init(root, quiet);
		expect(read(root, "src/layouts/Base.astro")).toContain("colorScheme.init()");
	});
});

describe("migrate", () => {
	const run = (files: Record<string, string>, write = true) => {
		const root = project(files);
		migrate(
			Object.keys(files).map((f) => join(root, f)),
			{ write, cwd: root, log: () => {} }
		);
		return (f: string) => read(root, f);
	};

	it("renames BrandPreset to PresetDefinition in ts, imports and usages", () => {
		const out = run({
			"theme.ts": `import type { BrandPreset } from "@codeatlasdev/ui";\nexport const brand: BrandPreset = { id: "a", color: "#2563eb" };\nconst list: BrandPreset[] = [];\n`,
		});
		const ts = out("theme.ts");
		expect(ts).toContain('import type { PresetDefinition } from "@codeatlasdev/ui";');
		expect(ts).toContain("const brand: PresetDefinition");
		expect(ts).toContain("const list: PresetDefinition[]");
		expect(ts).not.toContain("BrandPreset");
	});

	it("rewrites inside a svelte <script> and keeps the markup untouched", () => {
		const out = run({
			"a.svelte": `<script lang="ts">\n  import type { BrandPreset } from '@codeatlasdev/ui/vite';\n  let { p }: { p: BrandPreset } = $props();\n</script>\n<p>BrandPreset {p.id}</p>\n`,
		});
		const svelte = out("a.svelte");
		expect(svelte).toContain("import type { PresetDefinition } from '@codeatlasdev/ui/vite';");
		expect(svelte).toContain("p: PresetDefinition");
		expect(svelte).toContain("<p>BrandPreset {p.id}</p>");
	});

	it("keeps a leading comment and a second (module) script in a svelte file", () => {
		const out = run({
			"m.svelte": `<script module lang="ts">\n  // shared\n  import type { BrandPreset } from "@codeatlasdev/ui";\n  export type P = BrandPreset;\n</script>\n<script lang="ts">\n  import type { BrandPreset } from "@codeatlasdev/ui";\n  let x: BrandPreset;\n</script>\n`,
		});
		const svelte = out("m.svelte");
		expect(svelte).toContain("// shared");
		expect(svelte).not.toContain("BrandPreset");
		expect(svelte.match(/PresetDefinition/g)).toHaveLength(4);
	});

	it("keeps an alias and leaves same-named things from other packages alone", () => {
		const out = run({
			"b.ts": `import type { BrandPreset as Brand } from "@codeatlasdev/ui";\nimport type { BrandPreset } from "other-lib";\nlet x: Brand;\nlet y: BrandPreset;\n`,
		});
		const ts = out("b.ts");
		expect(ts).toContain('import type { PresetDefinition as Brand } from "@codeatlasdev/ui";');
		expect(ts).toContain('import type { BrandPreset } from "other-lib";');
		expect(ts).toContain("let y: BrandPreset;");
	});

	it("does not touch files without changes, and --write off only reports", () => {
		const src = `import type { BrandPreset } from "@codeatlasdev/ui";\n`;
		const out = run({ "c.ts": src, "d.ts": `export const a = 1;\n` }, false);
		expect(out("c.ts")).toBe(src);
		expect(out("d.ts")).toBe("export const a = 1;\n");
	});
});

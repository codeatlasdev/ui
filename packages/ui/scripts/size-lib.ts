// Shared by size-limit.ts and the bundle-content tests: bundle an entry of dist/ the way a consumer's
// bundler would (esbuild, ESM, minified, tree-shaken, Svelte runtime included).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { build, type Plugin } from "esbuild";
import { compile, compileModule } from "svelte/compiler";

export const dist = join(import.meta.dir, "..", "dist");

export interface Entry {
	name: string;
	/** JS entry contents (resolved from dist) or a CSS file path under dist. */
	js?: string;
	css?: string;
	/** Skipped when this path under dist does not exist (an entry that has not landed yet). */
	requires?: string;
}

/** Compiles .svelte and .svelte.js/.ts files from dist the way vite-plugin-svelte would. */
export const sveltePlugin: Plugin = {
	name: "svelte",
	setup(b) {
		b.onLoad({ filter: /\.svelte$/ }, ({ path }) => {
			const r = compile(readFileSync(path, "utf8"), {
				filename: path,
				generate: "client",
				css: "external",
			});
			return { contents: r.js.code, loader: "js", resolveDir: dirname(path) };
		});
		b.onLoad({ filter: /\.svelte\.(js|ts)$/ }, ({ path }) => {
			const r = compileModule(readFileSync(path, "utf8"), { filename: path, generate: "client" });
			return { contents: r.js.code, loader: "js", resolveDir: dirname(path) };
		});
	},
};

/** Gzip size, plus the package modules that ended up in the bundle (for the tree-shaking guard). */
export async function measure(
	e: Entry
): Promise<{ gzip: number; modules: string[]; code: string }> {
	const res = await build({
		metafile: true,
		stdin: e.css
			? { contents: `@import "./${e.css}";`, resolveDir: dist, loader: "css" }
			: { contents: e.js ?? "", resolveDir: dist, loader: "js" },
		bundle: true,
		minify: true,
		format: "esm",
		write: false,
		outdir: "out",
		treeShaking: true,
		conditions: ["svelte", "browser", "import", "default"],
		mainFields: ["svelte", "browser", "module", "main"],
		plugins: [sveltePlugin],
		logLevel: "error",
		// Remote/relative assets (fonts) are not part of the byte budget.
		external: e.css ? ["*.woff2"] : [],
		// esm-env picks its production build from the "development" condition being absent.
	});
	// A CSS bundle yields one .css file; JS bundles yield one .js (esbuild extracts no css for stdin js).
	const out = res.outputFiles.find((f) => f.path.endsWith(e.css ? ".css" : ".js"));
	if (!out) throw new Error(`no output for ${e.name}`);
	const meta =
		res.metafile.outputs[
			Object.keys(res.metafile.outputs).find((k) => k.endsWith(e.css ? ".css" : ".js")) ?? ""
		];
	const modules = Object.keys(meta?.inputs ?? {}).filter((k) => k.startsWith("dist/"));
	return { gzip: gzipSync(out.contents, { level: 9 }).length, modules, code: out.text };
}

/**
 * Strings of groups that a Button-only bundle must not contain (#325): each component pays only for
 * its own i18n group. One sample per group, English and pt-BR where the text differs.
 */
export const FOREIGN_STRINGS = [
	// commandPalette
	"Command palette",
	"Paleta de comandos",
	"Search failed",
	// combobox
	"Selected values",
	"Valores selecionados",
	// appShell
	"Module navigation",
	"Navegação de módulos",
	"Resize navigation panel",
	// motionStage
	"Replay",
	// docs / copyButton
	"On this page",
	"Could not copy",
];

/** esbuild escapes non-ASCII (`…`, `ã`) in minified output; compare decoded text. */
const decode = (code: string) =>
	code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)));

/** The sampled strings of other components' groups found in a bundle. */
export function foreignStrings(code: string): string[] {
	const text = decode(code);
	return FOREIGN_STRINGS.filter((s) => text.includes(s));
}

// Bundle-size budget for the built package (dist/). Run after `bun run build:pkg`.
//   bun scripts/size-limit.ts            check against size-limit.json (exit 1 over budget)
//   bun scripts/size-limit.ts --update   re-measure and lower limits that have room (ratchet)
//   bun scripts/size-limit.ts --init     write limits as measured +5% (first run)
//
// Each entry is bundled the way a consumer's bundler would: esbuild, ESM, minified, tree-shaken,
// with the Svelte runtime and bits-ui included (that is what ships). The metric is gzip bytes.
// The ratchet only moves down: --update never raises a limit, raise one by hand in a PR that explains why.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { build, type Plugin } from "esbuild";
import { compile, compileModule } from "svelte/compiler";

const root = join(import.meta.dir, "..");
const dist = join(root, "dist");
const limitsFile = join(root, "size-limit.json");
const HEADROOM = 1.05;

interface Entry {
	name: string;
	/** JS entry contents (resolved from dist) or a CSS file path under dist. */
	js?: string;
	css?: string;
	/** Skipped when this path under dist does not exist (an entry that has not landed yet). */
	requires?: string;
}

// Divider has no package dependencies, so "Divider only" is the Svelte client runtime plus ~250 B
// of ours: the floor any Svelte component costs. "Button only" minus that floor is what the
// package adds (Spinner, the i18n catalogs, clsx).
const ENTRIES: Entry[] = [
	{
		name: "floor: Divider only",
		js: `export { Divider } from "./index.js";`,
	},
	{ name: "root: Button only", js: `export { Button } from "./index.js";` },
	{ name: "root: AppShellLayout", js: `export { AppShellLayout } from "./index.js";` },
	{ name: "./seo", js: `export * from "./seo/index.js";`, requires: "seo/index.js" },
	{ name: "styles/core.css", css: "styles/core.css" },
	{ name: "styles/global.css", css: "styles/global.css" },
];

/** Compiles .svelte and .svelte.js/.ts files from dist the way vite-plugin-svelte would. */
const sveltePlugin: Plugin = {
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
async function measure(e: Entry): Promise<{ gzip: number; modules: string[] }> {
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
	return { gzip: gzipSync(out.contents, { level: 9 }).length, modules };
}

/** Importing `Button` must not drag in other components, stores or the theme engine. */
// announce: Button announces when `loading` ends (screen readers).
const BUTTON_ALLOWED =
	/^dist\/(index\.js|components\/(Button|Spinner)\/|i18n\/|utils\/announce\.js$)/;

if (!existsSync(join(dist, "index.js"))) {
	console.error("dist/ not found: run `bun run build:pkg` first");
	process.exit(1);
}

const mode = process.argv.includes("--init")
	? "init"
	: process.argv.includes("--update")
		? "update"
		: "check";
const limits: Record<string, number> = existsSync(limitsFile)
	? JSON.parse(readFileSync(limitsFile, "utf8"))
	: {};
const next: Record<string, number> = { ...limits };
const kb = (n: number) => `${(n / 1024).toFixed(2)} kB`;
let failed = 0;

for (const e of ENTRIES) {
	if (e.requires && !existsSync(join(dist, e.requires))) {
		console.log(`skip   ${e.name} (not built)`);
		continue;
	}
	const { gzip: size, modules } = await measure(e);
	if (e.name === "root: Button only") {
		const leaked = modules.filter((m) => !BUTTON_ALLOWED.test(m));
		if (leaked.length) {
			console.error(
				`FAIL   ${e.name}: tree-shaking leak, unexpected modules:\n  ${leaked.join("\n  ")}`
			);
			failed++;
		}
	}
	const limit = limits[e.name];
	const target = Math.ceil(size * HEADROOM);
	if (mode === "init" || limit === undefined) {
		if (mode === "check") {
			console.error(`FAIL   ${e.name}: no limit recorded; run \`bun run size:update\``);
			failed++;
			continue;
		}
		next[e.name] = target;
	} else if (mode === "update") {
		next[e.name] = Math.min(limit, target);
	}
	const shown = next[e.name] ?? limit;
	const over = size > shown;
	if (over) failed++;
	console.log(`${over ? "FAIL  " : "ok    "} ${e.name}: ${kb(size)} gzip (limit ${kb(shown)})`);
}

if (mode !== "check") writeFileSync(limitsFile, `${JSON.stringify(next, null, "\t")}\n`);
if (failed) {
	console.error(`\n${failed} entr${failed === 1 ? "y" : "ies"} over budget`);
	process.exit(1);
}

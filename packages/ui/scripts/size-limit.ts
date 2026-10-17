// Bundle-size budget for the built package (dist/). Run after `bun run build:pkg`.
//   bun scripts/size-limit.ts            check against size-limit.json (exit 1 over budget)
//   bun scripts/size-limit.ts --update   re-measure and lower limits that have room (ratchet)
//   bun scripts/size-limit.ts --init     write limits as measured +5% (first run)
//
// Each entry is bundled the way a consumer's bundler would: esbuild, ESM, minified, tree-shaken,
// with the Svelte runtime and @floating-ui included (that is what ships). The metric is gzip bytes.
// The ratchet only moves down: --update never raises a limit, raise one by hand in a PR that explains why.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dist, type Entry, foreignStrings, measure } from "./size-lib.js";

const root = join(import.meta.dir, "..");
const limitsFile = join(root, "size-limit.json");
const HEADROOM = 1.05;

// Divider has no package dependencies, so "Divider only" is the Svelte client runtime plus ~250 B
// of ours: the floor any Svelte component costs. "Button only" minus that floor is what the
// package adds (Spinner, its own i18n groups, clsx).
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
	const { gzip: size, modules, code } = await measure(e);
	if (e.name === "root: Button only") {
		const leaked = modules.filter((m) => !BUTTON_ALLOWED.test(m));
		if (leaked.length) {
			console.error(
				`FAIL   ${e.name}: tree-shaking leak, unexpected modules:\n  ${leaked.join("\n  ")}`
			);
			failed++;
		}
		// i18n/ is allowed above, so a stray group import is only visible in the text: Button must
		// carry its own strings (and Spinner's), not those of other components.
		const foreign = foreignStrings(code);
		if (foreign.length) {
			console.error(
				`FAIL   ${e.name}: i18n leak, strings of other components' groups in the bundle:\n  ${foreign.join("\n  ")}\n  Import only the groups a component reads (useMessages(group)); see AGENTS.md > Language (i18n).`
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

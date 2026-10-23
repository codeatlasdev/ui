#!/usr/bin/env node
/**
 * codeatlas-ui: project setup and migration.
 *
 *   bunx @codeatlasdev/ui init [--write] [--dir <path>] [--with lint,e2e,pwa]
 *   bunx @codeatlasdev/ui lint [paths...]
 *   bunx @codeatlasdev/ui migrate [--from <major> --to <major>] [--report json|md] [--write] [--strict] [paths...]
 *   bunx @codeatlasdev/ui migrate-react [--write] [paths...]
 *   bunx @codeatlasdev/ui doctor [--fix] [--dir <path>]
 *   bunx @codeatlasdev/ui compare <urlA> <urlB> [--selector <css,...>] [--viewport 390,1280] [--props <list>] [--tolerance <px>]
 *   bunx @codeatlasdev/ui tokens import <css|json> [--map <json>] [--out <file>] [--force] [--strict]
 *   bunx @codeatlasdev/ui brand [--theme <file>] [--mark <svg>] [--out <dir>] ...
 *   bunx @codeatlasdev/ui workarounds [--strict] [paths...]
 *   bunx @codeatlasdev/ui pick [ids...] [--url <gallery>] [--timeout <seconds>]
 *
 * `init` is a dry run unless `--write` is passed: it reports the files it would create and prints a
 * unified diff of the change it proposes to existing ones. Files that already exist are never
 * overwritten wholesale.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCompare } from "../src/cli/compare.ts";
import { runDoctor } from "../src/cli/doctor.ts";
import { init } from "../src/cli/init.ts";
import { migrate } from "../src/cli/migrate.ts";
import { migrateReact } from "../src/cli/migrate-react.ts";
import { parseIds, runPick } from "../src/cli/pick.ts";
import { runTokensImport } from "../src/cli/tokens-import.ts";
import { runGuard } from "../src/cli/ui-guard.ts";
import { type PartsData, runWorkarounds } from "../src/cli/workarounds.ts";

const [cmd, ...rest] = process.argv.slice(2);
const write = rest.includes("--write");
const strict = rest.includes("--strict");
const flag = (name: string) => {
	const i = rest.indexOf(`--${name}`);
	return i >= 0 ? rest[i + 1] : undefined;
};
const valueFlags = [
	"dir",
	"map",
	"with",
	"from",
	"to",
	"report",
	"selector",
	"viewport",
	"props",
	"tolerance",
	"theme",
	"mark",
	"out",
	"base",
	"manifest",
	"name",
	"short-name",
	"url",
	"timeout",
];
const isFlagValue = (i: number) => valueFlags.some((f) => rest[i - 1] === `--${f}`);
const args = rest.filter((a, i) => !a.startsWith("--") && !isFlagValue(i));

const HELP = `codeatlas-ui <command>

  init     Wire @codeatlasdev/ui into a SvelteKit or Astro project
  migrate  Rewrite code for renamed APIs and report what is left, per major (--from 2 --to 4; see MIGRATION.md)
  compare  compare <urlA> <urlB>: diff boxes, computed styles and pixels of the same elements at 390 and 1280px, sorted by deviation
  migrate-react  List the shadcn/Radix/Base UI/MUI imports of a React app with their replacement; fix React props in ported .svelte files
  lint     UI guard for the app: no hex colors or raw px, no inline styles, no :global(.ca-*) outside ui-guard.config.json, no literal text in templates
  doctor   Check peers, theme wiring, viewport meta, root font size and markers; one-line fixes (--fix applies the safe ones)
  tokens   tokens import <css|json>: turn your design tokens into theme.ts, alpha flattened and every low-contrast pair listed
  brand    Render the brand icons and src/generated/brand.ts without a Vite run (type-check jobs)
  workarounds  List the ca-ui-workaround(#n) markers in src and which issues are closed; flag .ca-* selectors that target non-stable parts (read-only)
  pick     Open the gallery, pick numbered demos, print their ids (e.g. #012 #045) for your AI

Options:
  --write      create the missing files and apply the proposed changes (without it init only reports)
  --strict     migrate: exit 1 when a usage was left for you to finish; workarounds: exit 1 when a selector targets a non-stable part
  --selector <l>  compare: CSS selectors, comma separated (default: every [data-testid])
  --viewport <l>  compare: widths, comma separated (default: 390,1280)
  --props <l>  compare: computed style properties, camelCase (default: weight, size, color, padding, margin, radius, gap)
  --tolerance <px>  compare: ignore box differences up to this many px (default: 0.5)
  --map <f>    tokens import: JSON of role -> token name (default: the shadcn names)
  --with <l>   init: also write lint, e2e and/or pwa (manifest, service worker, offline, robots, sitemap) (comma separated)
  --force      tokens import: overwrite --out
  --fix        doctor: apply the safe fixes (TODO(lib#n) to ca-ui-workaround(#n))
  --dir <p>    project directory (init, brand, doctor; default: cwd)
  --url <u>    pick: gallery page to open (default: https://ui.codeatlas.com.br/gallery/)
  --timeout <s>  pick: give up after this many seconds (default: 600)

brand options (same as caBrandPlugin): --theme <file exporting theme> --mark <svg>
  --out <dir> --base <url> --manifest <file> --name <text> --short-name <text>
`;

if (cmd === "init") {
	const root = resolve(flag("dir") ?? process.cwd());
	process.exit(init(root, { write, with: flag("with")?.split(",").filter(Boolean) }) ? 0 : 1);
} else if (cmd === "migrate") {
	const targets = args.length ? args : ["src"];
	const files = targets.flatMap((t) => collect(resolve(t)));
	const major = (name: string) => {
		const v = flag(name);
		if (v === undefined) return undefined;
		if (!/^\d+$/.test(v)) {
			process.stderr.write(`migrate: --${name} must be a major version number, got "${v}"\n`);
			process.exit(1);
		}
		return Number(v);
	};
	const report = flag("report");
	if (report !== undefined && report !== "json" && report !== "md") {
		process.stderr.write(`migrate: --report must be json or md, got "${report}"\n`);
		process.exit(1);
	}
	process.exit(
		migrate(files, {
			write,
			strict,
			cwd: process.cwd(),
			from: major("from"),
			to: major("to"),
			report,
		})
			? 0
			: 1
	);
} else if (cmd === "compare") {
	const [urlA, urlB] = args;
	const list = (name: string) => flag(name)?.split(",").filter(Boolean);
	const viewports = list("viewport")?.map(Number);
	const tolerance = flag("tolerance");
	if (
		!urlA ||
		!urlB ||
		viewports?.some((v) => !(v > 0)) ||
		(tolerance && !(Number(tolerance) >= 0))
	) {
		process.stderr.write(
			"usage: codeatlas-ui compare <urlA> <urlB> [--selector <css,...>] [--viewport 390,1280] [--props <list>] [--tolerance <px>]\n"
		);
		process.exit(1);
	}
	process.exit(
		await runCompare(urlA, urlB, {
			selectors: list("selector"),
			viewports,
			props: list("props"),
			tolerancePx: tolerance ? Number(tolerance) : undefined,
		})
	);
} else if (cmd === "lint") {
	const configFile = resolve("ui-guard.config.json");
	const allow: string[] = existsSync(configFile)
		? (JSON.parse(readFileSync(configFile, "utf8")).allow ?? [])
		: [];
	process.exit(runGuard(args.length ? args : ["src"], { allow }));
} else if (cmd === "tokens") {
	const [sub, input] = args;
	if (sub !== "import" || !input) {
		process.stderr.write(
			"usage: codeatlas-ui tokens import <css|json> [--map <json>] [--out <file>] [--force] [--strict]\n"
		);
		process.exit(1);
	}
	process.exit(
		runTokensImport(input, {
			map: flag("map"),
			out: flag("out"),
			force: rest.includes("--force"),
			strict,
			cwd: process.cwd(),
		})
	);
} else if (cmd === "doctor") {
	process.exit(
		runDoctor(resolve(flag("dir") ?? process.cwd()), { fix: rest.includes("--fix") }).code
	);
} else if (cmd === "migrate-react") {
	const targets = args.length ? args : ["src"];
	const files = targets.flatMap((t) => collect(resolve(t), /\.(svelte|tsx|jsx)$/));
	process.exit(migrateReact(files, { write, cwd: process.cwd() }) ? 0 : 1);
} else if (cmd === "workarounds") {
	// Built to dist/bin/codeatlas-ui.js; the stable-parts list sits one level up in dist/.
	const partsFile = join(dirname(fileURLToPath(import.meta.url)), "..", "parts.json");
	const parts: PartsData | undefined = existsSync(partsFile)
		? JSON.parse(readFileSync(partsFile, "utf8"))
		: undefined;
	process.exit(await runWorkarounds(args.length ? args : ["src"], { parts, strict }));
} else if (cmd === "pick") {
	const ids = args.length ? parseIds(args.join(",")) : [];
	if (!ids) {
		process.stderr.write("pick: ids must be catalog numbers such as 12, 012 or #012\n");
		process.exit(1);
	}
	const seconds = Number(flag("timeout") ?? 600);
	if (!(seconds > 0)) {
		process.stderr.write("pick: --timeout must be a positive number of seconds\n");
		process.exit(1);
	}
	const abort = new AbortController();
	process.once("SIGINT", () => abort.abort());
	try {
		await runPick({ gallery: flag("url"), ids, timeoutMs: seconds * 1000, signal: abort.signal });
		process.exit(0);
	} catch (e) {
		process.stderr.write(`${(e as Error).message}\n`);
		process.exit(1);
	}
} else if (cmd === "brand") {
	const root = resolve(flag("dir") ?? process.cwd());
	// Lazy: only `brand` needs the renderer (native resvg); init/migrate start without it.
	const { runBrandCommand } = await import("../src/cli/brand.ts");
	process.exit(
		await runBrandCommand(root, {
			theme: flag("theme"),
			mark: flag("mark"),
			outDir: flag("out"),
			base: flag("base"),
			manifestFile: flag("manifest"),
			name: flag("name"),
			shortName: flag("short-name"),
		})
	);
} else {
	process.stdout.write(HELP);
	process.exit(cmd === "--help" || cmd === "-h" || !cmd ? 0 : 1);
}

function collect(path: string, pattern = /\.(svelte|ts|js|astro|mdx|css)$/): string[] {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return [path];
	return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? collect(join(path, e.name), pattern)
				: pattern.test(e.name)
					? [join(path, e.name)]
					: []
	);
}

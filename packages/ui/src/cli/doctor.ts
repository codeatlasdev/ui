/**
 * `codeatlas-ui doctor` (#383): offline checks of how an app uses the library, each finding with a
 * file:line when it has one and a one-line fix. `--fix` applies only the safe ones (a marker rename);
 * everything else is a hint, never a guess. Exit 1 when a finding is an error.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { groups } from "../lib/i18n/all.ts";
import { detectFramework } from "./init.ts";

export interface Finding {
	id: string;
	level: "error" | "warn";
	message: string;
	fix: string;
	file?: string;
	line?: number;
}

interface Pkg {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
}

export interface DoctorOptions {
	fix?: boolean;
	log?: (line: string) => void;
}

/** Optional peers and the entry that needs each one: an app importing the entry must install the peer. */
const FEATURE_PEERS: { entry: RegExp; peer: string; feature: string }[] = [
	{ entry: /@codeatlasdev\/ui\/table/, peer: "@tanstack/svelte-table", feature: "DataTable" },
	{ entry: /@codeatlasdev\/ui\/charts/, peer: "echarts", feature: "charts" },
	{ entry: /@codeatlasdev\/ui\/code/, peer: "shiki", feature: "CodeSnippet" },
	{ entry: /@codeatlasdev\/ui\/testing/, peer: "axe-core", feature: "the testing helpers" },
];

const SOURCE = /\.(svelte|ts|js|astro|mdx|css|html)$/;
const lineOf = (src: string, index: number) => src.slice(0, index).split("\n").length;

function walk(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.name === "node_modules" || e.name.startsWith(".")
			? []
			: e.isDirectory()
				? walk(join(dir, e.name))
				: SOURCE.test(e.name)
					? [join(dir, e.name)]
					: []
	);
}

/** Lowest major.minor a range admits (`^5.10.0`, `~5.3`, `5.40.1`, `>=5.33`), or null for `workspace:*`, `latest`... */
function floor(range: string | undefined): [number, number] | null {
	const m = range?.match(/(\d+)\.(\d+)/);
	return m ? [Number(m[1]), Number(m[2])] : null;
}

function peerFindings(deps: Record<string, string>, installed: (n: string) => string | undefined) {
	const out: Finding[] = [];
	const svelte = floor(installed("svelte") ?? deps.svelte);
	if (svelte && (svelte[0] < 5 || (svelte[0] === 5 && svelte[1] < 33)))
		out.push({
			id: "peer-svelte",
			level: "error",
			message: `svelte ${svelte.join(".")} is below the 5.33 the library needs`,
			fix: "bun add svelte@^5.33",
		});
	const kit = deps["@sveltejs/kit"];
	const k = floor(installed("@sveltejs/kit") ?? kit);
	if (k && !(k[0] === 3 || (k[0] === 2 && k[1] >= 12)))
		out.push({
			id: "peer-kit",
			level: "error",
			message: `@sveltejs/kit ${k.join(".")} is outside ^2.12 || ^3`,
			fix: "bun add @sveltejs/kit@^2.12 (or ^3)",
		});
	return out;
}

/** An optional peer the app's own imports need but package.json does not list. */
function optionalPeerFindings(files: string[], root: string, deps: Record<string, string>) {
	const out: Finding[] = [];
	for (const file of files.filter((f) => /\.(svelte|ts|js|astro)$/.test(f))) {
		const src = readFileSync(file, "utf8");
		for (const need of FEATURE_PEERS) {
			if (deps[need.peer]) continue;
			const m = src.match(new RegExp(`from\\s+["']${need.entry.source}[^"']*["']`));
			if (m?.index !== undefined)
				out.push({
					id: "optional-peer",
					level: "error",
					message: `${need.feature} needs the optional peer ${need.peer}`,
					fix: `bun add ${need.peer}`,
					file: relative(root, file),
					line: lineOf(src, m.index),
				});
		}
	}
	return out;
}

function read(root: string, path: string): string | null {
	const file = join(root, path);
	return existsSync(file) ? readFileSync(file, "utf8") : null;
}

function wiringFindings(root: string, files: string[]): Finding[] {
	const out: Finding[] = [];
	const fix = "bunx @codeatlasdev/ui init --write";
	const vite = read(root, "vite.config.ts") ?? read(root, "vite.config.js");
	if (vite !== null && !vite.includes("caThemePlugin"))
		out.push({
			id: "wiring-vite",
			level: "error",
			message:
				"vite config does not register caThemePlugin (no anti-FOUC script, no ssr.noExternal)",
			fix,
			file: "vite.config.ts",
		});
	const hooks = read(root, "src/hooks.server.ts") ?? read(root, "src/hooks.server.js");
	if (hooks !== null) {
		if (!hooks.includes("caThemeHandle"))
			out.push({
				id: "wiring-hook",
				level: "error",
				message: "hooks.server does not export handle with caThemeHandle",
				fix,
				file: "src/hooks.server.ts",
			});
		if (!/export const handleError/.test(hooks) && !hooks.includes("createErrorHandler"))
			out.push({
				id: "wiring-handle-error",
				level: "error",
				message:
					"hooks.server does not export handleError (server errors reach the client unsanitized)",
				fix,
				file: "src/hooks.server.ts",
			});
	}
	const hasCss = files.some(
		(f) =>
			/\.(svelte|ts|js|astro|css)$/.test(f) &&
			readFileSync(f, "utf8").includes("@codeatlasdev/ui/styles/")
	);
	if (!hasCss)
		out.push({
			id: "wiring-css",
			level: "error",
			message: "no file imports @codeatlasdev/ui/styles/global.css",
			fix: 'add import "@codeatlasdev/ui/styles/global.css" to the root layout',
		});
	return out;
}

function viewportFinding(root: string): Finding[] {
	const html = read(root, "src/app.html");
	if (html === null) return [];
	const m = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/);
	if (!m || m.index === undefined || m[0].includes("viewport-fit=cover")) return [];
	return [
		{
			id: "viewport-fit",
			level: "warn",
			message:
				"the viewport meta has no viewport-fit=cover, so the --ca-safe-* tokens stay 0 (content sits under the notch)",
			fix: 'use content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"',
			file: "src/app.html",
			line: lineOf(html, m.index),
		},
	];
}

/** `html { font-size }` or `:root { font-size }` in app CSS rescales every rem token of the kit (#351). */
function rootFontFindings(files: string[], root: string): Finding[] {
	const out: Finding[] = [];
	for (const file of files.filter((f) => f.endsWith(".css"))) {
		const src = readFileSync(file, "utf8");
		for (const rule of src.matchAll(/(^|[}\s,])(html|:root)\s*(?:,[^{]*)?\{([^}]*)\}/g)) {
			const decl = rule[3].match(/(^|[;\s])font-size\s*:/);
			if (decl?.index !== undefined)
				out.push({
					id: "root-font-size",
					level: "warn",
					message: "font-size on html/:root changes the rem base and resizes every component",
					fix: "set body text with --ca-font-size-body1 (or a typography role) instead",
					file: relative(root, file),
					line: lineOf(src, (rule.index ?? 0) + rule[0].indexOf("{") + (decl.index ?? 0)),
				});
		}
	}
	return out;
}

const TODO = /(TODO\(lib#(\d+)\)):?/g;

/** `TODO(lib#n)` is the other marker spelling; `workarounds` only reads `ca-ui-workaround(#n)`. */
function markerFindings(files: string[], root: string, fix: boolean): Finding[] {
	const out: Finding[] = [];
	for (const file of files.filter((f) => /\.(svelte|ts|js|astro|mdx|css)$/.test(f))) {
		const src = readFileSync(file, "utf8");
		const hits = [...src.matchAll(TODO)];
		for (const h of hits)
			out.push({
				id: "marker-todo",
				level: "warn",
				message: `TODO(lib#${h[2]}) is not read by \`workarounds\``,
				fix: `write ca-ui-workaround(#${h[2]}): reason (doctor --fix does it)`,
				file: relative(root, file),
				line: lineOf(src, h.index ?? 0),
			});
		if (fix && hits.length)
			writeFileSync(
				file,
				src.replace(TODO, (_, __, n) => `ca-ui-workaround(#${n}):`)
			);
	}
	return fix ? [] : out;
}

/** A `.ca-*` selector in app CSS with no gate: `workarounds --strict` is that gate. */
function selectorFinding(files: string[], root: string, scripts: string): Finding[] {
	if (scripts.includes("workarounds")) return [];
	for (const file of files.filter((f) => /\.(css|svelte|astro)$/.test(f))) {
		const src = readFileSync(file, "utf8");
		const m = src.match(/(^|[\s,>}:)])\.ca-[a-z][\w-]*\s*[{,:.[]/m);
		if (m?.index !== undefined)
			return [
				{
					id: "ca-selectors",
					level: "warn",
					message: "app CSS targets .ca-* classes and no script checks they are stable parts",
					fix: 'add "check:ca": "codeatlas-ui workarounds --strict" to package.json scripts and run it in CI',
					file: relative(root, file),
					line: lineOf(src, m.index),
				},
			];
	}
	return [];
}

/** The keys of ${group} in English, the shape every other locale is merged over. */
const catalogKeys = (group: string): Set<string> | null =>
	group in groups
		? new Set(Object.keys((groups as Record<string, { en: object }>)[group].en))
		: null;

const REGISTER = /registerLocale\(\s*["\x27`][^"\x27`]+["\x27`]\s*,\s*\{/g;
const GROUP_OPEN = /(^|[\s,{])([A-Za-z_$][\w$]*)\s*:\s*\{/g;
const KEY = /(^|[\s,{])([A-Za-z_$][\w$]*)\s*:/g;

/** Index just past the `}` that closes the `{` at `open`, skipping strings; -1 when unbalanced. */
function closeOf(src: string, open: number): number {
	let depth = 0;
	for (let i = open; i < src.length; i++) {
		const c = src[i];
		if (c === `"` || c === "\x27" || c === "`") {
			for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
		} else if (c === "{") depth++;
		else if (c === "}" && --depth === 0) return i + 1;
	}
	return -1;
}

/**
 * `registerLocale("es", { group: { key: "..." } })` merges over English, and a key the catalog does not
 * have is kept but never read: the screen stays English with no error. Reports each such group and key.
 */
function localeFindings(files: string[], root: string): Finding[] {
	const out: Finding[] = [];
	for (const file of files.filter((f) => /\.(ts|js|svelte|astro)$/.test(f))) {
		const src = readFileSync(file, "utf8");
		for (const call of src.matchAll(REGISTER)) {
			const open = (call.index ?? 0) + call[0].length - 1;
			const end = closeOf(src, open);
			if (end < 0) continue;
			const body = src.slice(open + 1, end - 1);
			const base = open + 1;
			const flag = (at: number, name: string) =>
				out.push({
					id: "locale-key",
					level: "warn",
					message: `registerLocale: "${name}" is not in the catalog, so it renders in English`,
					fix: "check the name with get_export / getMessages(\x27en\x27) (MCP) and correct or remove it",
					file: relative(root, file),
					line: lineOf(src, at),
				});
			for (const g of body.matchAll(GROUP_OPEN)) {
				const gOpen = base + (g.index ?? 0) + g[0].length - 1;
				const keys = catalogKeys(g[2]);
				if (!keys) {
					flag(gOpen, g[2]);
					continue;
				}
				const gEnd = closeOf(src, gOpen);
				const inner = src.slice(gOpen + 1, gEnd - 1);
				// Top-level keys of the group only: drop nested objects (message functions keep their own braces).
				let flat = "";
				for (let i = 0, depth = 0; i < inner.length; i++) {
					const c = inner[i];
					if (c === "{" || c === "(" || c === "[") depth++;
					else if (c === "}" || c === ")" || c === "]") depth--;
					flat += depth === 0 || c === "\n" ? c : " ";
				}
				for (const k of flat.matchAll(KEY))
					if (!keys.has(k[2])) flag(gOpen + 1 + (k.index ?? 0) + k[1].length, `${g[2]}.${k[2]}`);
			}
		}
	}
	return out;
}

/** An app with no UI guard script has no gate on hex colors, raw px or literal text in its templates. */
function lintGuardFinding(scripts: string): Finding[] {
	return /codeatlas-ui lint|ui-guard/.test(scripts)
		? []
		: [
				{
					id: "lint-guard",
					level: "warn",
					message:
						"no UI guard script: hex colors, raw px and literal text in templates go unchecked",
					fix: "run init --with lint --write (adds lint:ui: codeatlas-ui lint src)",
				},
			];
}

export function runDoctor(
	root: string,
	{ fix = false, log = console.log }: DoctorOptions = {}
): { findings: Finding[]; code: number } {
	const pkgPath = join(root, "package.json");
	const pkg: Pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, "utf8")) : {};
	const deps = { ...pkg.dependencies, ...pkg.devDependencies };
	const installed = (name: string): string | undefined => {
		const file = join(root, "node_modules", name, "package.json");
		return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).version : undefined;
	};

	const framework = detectFramework(root);
	if (!framework) {
		const findings: Finding[] = [
			{
				id: "no-framework",
				level: "error",
				message: "not a SvelteKit or Astro project (no @sveltejs/kit or astro dependency)",
				fix: "run doctor in the app directory",
			},
		];
		for (const f of findings) log(`error ${f.message}\n      fix: ${f.fix}`);
		return { findings, code: 1 };
	}
	const files = walk(join(root, "src")).concat(
		["vite.config.ts", "vite.config.js", "astro.config.mjs", "astro.config.ts"]
			.map((f) => join(root, f))
			.filter(existsSync)
	);
	const scripts = JSON.stringify(pkg.scripts ?? {});

	const findings = [
		...peerFindings(deps, installed),
		...optionalPeerFindings(files, root, deps),
		...(framework === "sveltekit" ? wiringFindings(root, files) : []),
		...viewportFinding(root),
		...rootFontFindings(files, root),
		...markerFindings(files, root, fix),
		...selectorFinding(files, root, scripts),
		...localeFindings(files, root),
		...lintGuardFinding(scripts),
	];
	for (const f of findings) {
		const at = f.file ? `${f.file}${f.line ? `:${f.line}` : ""} ` : "";
		log(`${f.level.padEnd(5)} ${at}${f.message}\n      fix: ${f.fix}`);
	}
	log(
		findings.length
			? `\n${findings.length} finding${findings.length === 1 ? "" : "s"}.`
			: "doctor: no problems found."
	);
	return { findings, code: findings.some((f) => f.level === "error") ? 1 : 0 };
}

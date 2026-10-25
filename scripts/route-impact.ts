/**
 * Which docs-site routes does a source file affect? Used by the Playwright route spec (viewport
 * sweep only on routes that render layout primitives or changed) and by `bun run test:changed`.
 *
 * The map is derived from source, never hand-kept:
 *   route  <- docs MDX (`site/src/content/docs/<slug>.mdx` -> `/docs/<slug>/`) or an Astro page
 *   MDX    <- imports demos (`~/demos/<group>/<name>/<Demo>.svelte`)
 *   demo   <- imports symbols from `@codeatlasdev/ui[/subpath]`
 *   symbol <- exported from a component folder (`packages/ui/src/lib/index.ts` and subpath barrels)
 * Anything that every page depends on (styles, tokens, theme, stores, the shared layout) selects all routes.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site/src");
const LIB = join(ROOT, "packages/ui/src/lib");

/** Components whose job is layout: a page that renders one is audited at every in-between width. */
export const LAYOUT_PRIMITIVES = new Set([
	"Stack",
	"Flex",
	"Grid",
	"Box",
	"Container",
	"Section",
	"PageShell",
	"PageFrame",
	"AppShellLayout",
	"AppList",
	"AppForm",
	"AppSettings",
	"AuthLayout",
	"MobilePane",
	"StickyActions",
	"ResizablePanels",
	"KpiGrid",
	"CardGrid",
	"MediaGrid",
	"FormSection",
	"DocsShell",
]);

/** Changes under these paths can alter every page: select all routes. */
const GLOBAL = [
	/^packages\/ui\/src\/lib\/(styles|tokens|theme|stores|utils|actions|primitives)\//,
	/^packages\/ui\/src\/lib\/(index|theme-script|vite-plugin|astro|brand|types)\.ts$/,
	/^packages\/ui\/package\.json$/,
	/^site\/(astro\.config\.mjs|package\.json|svelte\.config\.js|playwright\.config\.ts)$/,
	/^site\/src\/(layouts|styles|lib|theme\.ts|content\.config\.ts|components\/(docs|site))\//,
	/^site\/src\/(theme|content\.config)\.ts$/,
	/^site\/tests\/(fixtures|routes|routes\.spec|routes\.axe\.spec|layout-audit|dist-html\.spec|timing-reporter|screenshot)\.(ts|css)$/,
	/^scripts\/route-impact\.ts$/,
	/^bun\.lock$/,
];

/**
 * Files that cannot change what a docs route renders or how it is checked: test files other than the
 * route harness, tooling, docs, CI and repo config. Everything else must map to a route (below) or it
 * counts as UNKNOWN and selects every route: a missed route is a silent hole, a full sweep is only time.
 */
const NO_ROUTE_IMPACT = [
	/\.md$/,
	/^(\.github|\.changeset|\.agents|\.vscode|docs)\//,
	/^(llms\.txt|lefthook\.yml|biome\.json|bunfig\.toml|tsconfig\.json|\.editorconfig|\.gitignore|LICENSE|NOTICE|package\.json)$/,
	/^scripts\//,
	/^packages\/ui\/tests\//,
	/^packages\/ui\/(vite\.config\.ts|svelte\.config\.js|tsconfig\.json|size-limit\.json|CHANGELOG\.md)$/,
	/\.(svelte\.test|vrt\.test|ssr\.test)\.ts$|\.test\.svelte$|__screenshots__\//,
	/^site\/functions\//,
	/^site\/tests\//,
];

const walk = (dir: string, ext: RegExp, out: string[] = []): string[] => {
	if (!existsSync(dir)) return out;
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, ext, out);
		else if (ext.test(name)) out.push(full);
	}
	return out;
};
const rel = (p: string) => relative(ROOT, p);
const read = (p: string) => readFileSync(p, "utf8");

/**
 * `import { A, B as C } from "@codeatlasdev/ui/charts"` -> `A`, `B` plus `@charts` (the subpath, so a
 * change under `src/lib/charts/` finds its routes without a symbol table for every barrel).
 */
function uiSymbols(src: string): string[] {
	const out: string[] = [];
	for (const m of src.matchAll(
		/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']@codeatlasdev\/ui(?:\/([a-z-]+))?[^"']*["']/g
	)) {
		if (m[2]) out.push(`@${m[2]}`);
		for (const part of m[1].split(",")) {
			const name = part
				.trim()
				.replace(/^type\s+/, "")
				.split(/\s+as\s+/)[0]
				.trim();
			if (name) out.push(name);
		}
	}
	return out;
}

/** exported name -> component folder (`components/<Folder>/`), from the package barrels. */
function symbolFolders(): Map<string, string> {
	const map = new Map<string, string>();
	const barrels = [join(LIB, "index.ts"), ...walk(LIB, /^index\.ts$/)];
	for (const file of new Set(barrels)) {
		const src = read(file);
		for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["']([^"']+)["']/g)) {
			const target = join(dirname(file), m[2]);
			const folder = rel(target).match(/components\/([^/]+)\//)?.[1];
			if (!folder) continue;
			for (const part of m[1].split(",")) {
				const name = part
					.trim()
					.replace(/^type\s+/, "")
					.split(/\s+as\s+/)
					.pop()
					?.trim();
				if (name) map.set(name, folder);
			}
		}
	}
	return map;
}

export interface RouteImpact {
	/** route -> package symbols its demos/page use */
	symbols: Map<string, Set<string>>;
	/** route -> repo-relative source files it is built from (MDX, demos, page, templates) */
	files: Map<string, Set<string>>;
	/** symbol -> component folder */
	folders: Map<string, string>;
	/** component folders the site's own shell code (layouts, docs shell, site chrome) renders on every page */
	globalFolders: Set<string>;
}

const docRoute = (mdx: string) =>
	`/docs/${relative(join(SITE, "content/docs"), mdx)
		.replace(/\.mdx$/, "")
		.replace(/(^|\/)index$/, "")}/`.replace("//", "/");

/** Astro page -> route (`pages/templates/app/users/index.astro` -> `/templates/app/users/`). */
const pageRoute = (page: string) =>
	`/${relative(join(SITE, "pages"), page)
		.replace(/\.astro$/, "")
		.replace(/(^|\/)index$/, "")}/`.replace("//", "/");

export function buildImpact(): RouteImpact {
	const symbols = new Map<string, Set<string>>();
	const files = new Map<string, Set<string>>();
	const bucket = (map: Map<string, Set<string>>, route: string) => {
		const set = map.get(route) ?? new Set<string>();
		map.set(route, set);
		return set;
	};
	const add = (route: string, file: string, src: string) => {
		bucket(files, route).add(rel(file));
		for (const s of uiSymbols(src)) bucket(symbols, route).add(s);
	};
	const demoFile = (spec: string) => join(SITE, spec.replace(/^~\//, ""));

	for (const mdx of walk(join(SITE, "content/docs"), /\.mdx$/)) {
		const route = docRoute(mdx);
		const src = read(mdx);
		add(route, mdx, src);
		for (const m of src.matchAll(/from\s+["'](~\/demos\/[^"']+\.svelte)["']/g)) {
			const file = demoFile(m[1]);
			if (existsSync(file)) add(route, file, read(file));
		}
	}
	// Astro pages pull their islands (landing, theme, gallery, templates) in through relative `~/` imports.
	const seen = new Set<string>();
	const followImports = (route: string, file: string) => {
		if (seen.has(`${route}|${file}`) || !existsSync(file)) return;
		seen.add(`${route}|${file}`);
		const src = read(file);
		add(route, file, src);
		for (const m of src.matchAll(/(?:from|import)\s+["'](~\/[^"']+\.(?:svelte|astro|ts))["']/g))
			if (!m[1].includes("/pages/")) followImports(route, demoFile(m[1]));
	};
	for (const page of walk(join(SITE, "pages"), /\.astro$/)) {
		if (page.includes("[...slug]") || page.includes("/llms/")) continue;
		followImports(pageRoute(page), page);
	}
	// A package component rendered by the site's own shell (not by a demo) is on every page.
	const folders = symbolFolders();
	const globalFolders = new Set<string>();
	const shell = [
		...walk(join(SITE, "layouts"), /\.(astro|svelte|ts)$/),
		...walk(join(SITE, "lib"), /\.(astro|svelte|ts)$/),
		...walk(join(SITE, "components/docs"), /\.(astro|svelte|ts)$/),
		...walk(join(SITE, "components/site"), /\.(astro|svelte|ts)$/),
	];
	for (const file of shell)
		for (const sym of uiSymbols(read(file))) {
			const folder = folders.get(sym);
			if (folder) globalFolders.add(folder);
		}
	return { symbols, files, folders, globalFolders };
}

/** Routes whose source is `file` (a docs MDX, a demo, a page, a template). */
function routesOfSite(impact: RouteImpact, file: string): string[] {
	return [...impact.files].filter(([, fs]) => fs.has(file)).map(([r]) => r);
}

/** Routes that use a symbol exported from `components/<folder>/`. */
function routesOfFolder(impact: RouteImpact, folder: string): string[] {
	const names = new Set([...impact.folders].filter(([, f]) => f === folder).map(([n]) => n));
	return [...impact.symbols].filter(([, s]) => [...s].some((n) => names.has(n))).map(([r]) => r);
}

export interface Selection {
	/** every route: a changed file can alter every page, or the map does not know the file */
	all: boolean;
	/** why `all` (empty otherwise): the file and the rule */
	reason: string;
	routes: string[];
	/** why each route was chosen: route -> changed file */
	why: Map<string, string>;
	/** changed component folders (for the VRT selection) */
	folders: Set<string>;
}

/**
 * Routes affected by `changed` (repo-relative paths). Fails safe: a file under a shared path, a
 * component the site shell renders on every page, or a file the map does not recognise selects ALL
 * routes, and says which file and why.
 */
export function select(changed: string[], impact = buildImpact()): Selection {
	const why = new Map<string, string>();
	const folders = new Set<string>();
	const pick = (routes: string[], file: string) => {
		for (const r of routes) if (!why.has(r)) why.set(r, file);
	};
	const everything = (file: string, reason: string): Selection => ({
		all: true,
		reason: `${file}: ${reason}`,
		routes: [],
		why: new Map(),
		folders,
	});
	for (const f of changed) {
		if (GLOBAL.some((re) => re.test(f))) return everything(f, "shared by every page");
		const comp = f.match(/^packages\/ui\/src\/lib\/components\/([^/]+)\//);
		if (comp) {
			folders.add(comp[1]);
			if (NO_ROUTE_IMPACT.some((re) => re.test(f))) continue;
			if (impact.globalFolders.has(comp[1]))
				return everything(f, `${comp[1]} is rendered by the site shell on every page`);
			pick(routesOfFolder(impact, comp[1]), f);
			continue;
		}
		const sub = f.match(/^packages\/ui\/src\/lib\/(charts|map|forms|seo|kit|i18n|testing)\//);
		if (sub) {
			pick(
				[...impact.symbols].filter(([, s]) => s.has(`@${sub[1]}`)).map(([r]) => r),
				f
			);
			continue;
		}
		if (NO_ROUTE_IMPACT.some((re) => re.test(f))) continue;
		if (/^site\/src\//.test(f)) {
			const routes = routesOfSite(impact, f);
			if (!routes.length) return everything(f, "no route is built from this site file");
			pick(routes, f);
			continue;
		}
		return everything(f, "not a file the route map knows");
	}
	return { all: false, reason: "", routes: [...why.keys()].sort(), why, folders };
}

/** Routes the viewport sweep covers: layout primitives, templates/landing/theme (composed pages), changed. */
export function sweepRoutes(all: string[], changed: string[] = []): Set<string> {
	const impact = buildImpact();
	const out = new Set<string>();
	for (const r of all) {
		const used = impact.symbols.get(r);
		if (!r.startsWith("/docs/") || (used && [...used].some((s) => LAYOUT_PRIMITIVES.has(s))))
			out.add(r);
	}
	const sel = select(changed, impact);
	if (sel.all) for (const r of all) out.add(r);
	else for (const r of sel.routes) out.add(r);
	return out;
}

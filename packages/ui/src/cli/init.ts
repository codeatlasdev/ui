import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { CONSUMER_GUIDE, GUIDE_END, GUIDE_START } from "./agent-guide.ts";
import { unifiedDiff } from "./diff.ts";

export type Framework = "sveltekit" | "astro";

interface Pkg {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

/** One file the setup wants: created when absent, otherwise patched (diff only unless `--write`). */
interface Step {
	path: string;
	/** Content for a file that does not exist yet. */
	create?: string;
	/** Rewrites an existing file. Returns the same text when nothing needs to change, `null` when it cannot patch safely. */
	patch?: (current: string) => string | null;
	/** Shown when `patch` returns `null`. */
	manual?: string;
	/** The step is intentionally skipped: why. Nothing is created or patched. */
	note?: string;
}

const THEME_BODY = `/**
 * One theme for the whole app. Pass it to caThemeHandle / caThemePlugin (SvelteKit)
 * or caUI (Astro) so the first paint already has the right preset and scheme.
 * Add a brand color with \`presets: [{ id: "brand", color: "#2563eb" }]\` and
 * \`defaultPreset: "brand"\`.
 *
 * Keep this a plain object and import only from \`@codeatlasdev/ui/vite\` (or \`/astro\`): vite.config
 * loads it in Node, where the package root (which imports .svelte files) cannot be evaluated. That
 * entry also exports \`designStyle("liquid", { ... })\` for a design recipe.
 */
export const theme: ThemeOptions = {
	defaultPreset: "amber",
	defaultScheme: "system",
};
`;
const THEME_TS = `import type { ThemeOptions } from "@codeatlasdev/ui/vite";\n\n${THEME_BODY}`;
const ASTRO_THEME_TS = `import type { ThemeOptions } from "@codeatlasdev/ui/astro";\n\n${THEME_BODY}`;

const VIEWPORT =
	"width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content";

function readDeps(root: string): Record<string, string> | null {
	const pkgPath = join(root, "package.json");
	if (!existsSync(pkgPath)) return null;
	const pkg: Pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
	return { ...pkg.dependencies, ...pkg.devDependencies };
}

export function detectFramework(root: string): Framework | null {
	const deps = readDeps(root);
	if (deps?.["@sveltejs/kit"]) return "sveltekit";
	if (deps?.astro) return "astro";
	return null;
}

/**
 * Major version of `@sveltejs/kit`. The installed package is authoritative; the declared range is
 * the fallback before `install` ran. Ranges like `^3.0.1`, `~2.20.0`, `>=3`, `3.0.1`, `next` all
 * resolve to the first number; anything unparseable counts as 2 (the long-standing shape).
 */
export function kitMajor(root: string): number {
	const installed = join(root, "node_modules/@sveltejs/kit/package.json");
	let version: string | undefined = readDeps(root)?.["@sveltejs/kit"];
	if (existsSync(installed)) {
		const pkg: unknown = JSON.parse(readFileSync(installed, "utf8"));
		if (pkg && typeof pkg === "object" && "version" in pkg && typeof pkg.version === "string")
			version = pkg.version;
	}
	const major = Number(version?.match(/\d+/)?.[0]);
	return Number.isInteger(major) && major > 0 ? major : 2;
}

/**
 * Import specifier for a module under `src/lib`, from a file in `src/`. Kit 3 removed `$lib` (using
 * it fails with `module_removed_lib`) in favor of the `#lib/*` package import: init adds that map to
 * package.json (`libImportsStep`) and uses it, written with the extension because neither the map
 * nor Node's native config loader add one. Kit 2 apps keep `$lib`.
 */
function libImport(root: string, name: string): string {
	return kitMajor(root) >= 3 ? `#lib/${name}.ts` : `$lib/${name}`;
}

/**
 * package.json for a SvelteKit app. `scripts.prepare` runs `svelte-kit sync` after every install:
 * without the generated types svelte-check cannot resolve `$app/tsconfig` (Kit 3) or
 * `.svelte-kit/tsconfig.json` (Kit 2) on a fresh clone. Kit 3 also gets `imports["#lib/*"]`.
 * Anything the app already has is kept, never replaced.
 */
function kitPackagePatch(kit3: boolean) {
	return (src: string): string | null => {
		const pkg = JSON.parse(src);
		const needImports = kit3 && !(pkg.imports && "#lib/*" in pkg.imports);
		const needPrepare = !pkg.scripts?.prepare;
		if (!needImports && !needPrepare) return src;
		const next = { ...pkg };
		if (needImports) next.imports = { ...pkg.imports, "#lib/*": "./src/lib/*" };
		if (needPrepare) next.scripts = { ...pkg.scripts, prepare: "svelte-kit sync" };
		const indent = src.match(/^(\s+)"/m)?.[1] ?? "\t";
		return `${JSON.stringify(next, null, indent)}\n`;
	};
}

/**
 * The app's `@sveltejs/adapter-static` setup, or `null` without it. `dir` is the output folder
 * svelte-check must not scan (default `build`, or the `pages` option of an `adapter({ pages })`
 * call in vite.config); `major` is the declared range's major, for the Kit pairing note.
 */
function adapterStatic(root: string): { dir: string; major: number | null } | null {
	const range = readDeps(root)?.["@sveltejs/adapter-static"];
	if (!range) return null;
	const vite = join(root, "vite.config.ts");
	const pages = existsSync(vite)
		? readFileSync(vite, "utf8").match(/\bpages:\s*["']([^"']+)["']/)?.[1]
		: undefined;
	const major = Number(range.match(/\d+/)?.[0]);
	return { dir: pages ?? "build", major: Number.isInteger(major) ? major : null };
}

/** Insert `line` after the last top-level import (or at the top when there is none). */
function addImport(src: string, line: string): string {
	if (src.includes(line)) return src;
	const imports = [...src.matchAll(/^import[^;]*?;[ \t]*$/gm)];
	const last = imports.at(-1);
	if (!last) return `${line}\n${src}`;
	const at = (last.index ?? 0) + last[0].length;
	return `${src.slice(0, at)}\n${line}${src.slice(at)}`;
}

/**
 * Module specifier of a `theme` the app already imports in one of `files` (the config or hook that
 * hands it to the theme plugin/handle), or `null`. The app then keeps its theme elsewhere (a shared
 * workspace package, say): init must not create a second, disagreeing one, and wires the files it
 * does touch to this one. An import of `own` (the file init writes: `src/lib/theme.ts`, reached
 * relatively, through `#lib` or through `$lib`) is init's own work from an earlier run, not the app's.
 */
function existingThemeSpec(root: string, files: string[], own: string): string | null {
	for (const file of files) {
		const abs = join(root, file);
		if (!existsSync(abs)) continue;
		const m = readFileSync(abs, "utf8").match(
			/import\s*\{[^}]*\btheme\b[^}]*\}\s*from\s*["']([^"']+)["']/
		);
		if (!m) continue;
		const target = /^[#$]lib\//.test(m[1])
			? join(root, "src/lib", m[1].slice(5))
			: m[1].startsWith(".")
				? join(dirname(abs), m[1])
				: null;
		if (target?.replace(/\.ts$/, "") === join(root, own).replace(/\.ts$/, "")) continue;
		return m[1];
	}
	return null;
}

// ── SvelteKit ─────────────────────────────────────────────────────────────────

/** Plugins init adds to `plugins`, in this order, each only when absent. Both go after `sveltekit()`. */
const VITE_PLUGINS = [
	{ name: "caThemePlugin", call: "caThemePlugin(theme)" },
	{ name: "caErrorPlugin", call: "caErrorPlugin({ scaffold: true, theme })" },
] as const;

const VITE_IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']@codeatlasdev\/ui\/vite["'];?/;

/** Add `names` to an existing `@codeatlasdev/ui/vite` import, or insert one. Sorted, so the output is stable. */
function mergeViteImport(src: string, names: string[]): string {
	const m = src.match(VITE_IMPORT);
	if (!m)
		return addImport(
			src,
			`import { ${[...names].sort().join(", ")} } from "@codeatlasdev/ui/vite";`
		);
	const have = m[1]
		.split(",")
		.map((n) => n.trim())
		.filter(Boolean);
	const all = [...new Set([...have, ...names])].sort();
	return src.replace(m[0], `import { ${all.join(", ")} } from "@codeatlasdev/ui/vite";`);
}

function viteConfigPatch(src: string, themeSpec: string): string | null {
	const missing = VITE_PLUGINS.filter((p) => !src.includes(`${p.name}(`));
	if (!missing.length) return src;
	// `plugins: [ sveltekit(...) ]`: append after the last element of the array.
	const m = src.match(/plugins:\s*\[/);
	if (!m || m.index === undefined) return null;
	// Find the matching `]` by bracket depth, skipping strings.
	let depth = 0;
	let end = -1;
	for (let i = m.index + m[0].length - 1; i < src.length; i++) {
		const ch = src[i];
		if (ch === '"' || ch === "'" || ch === "`") {
			const q = ch;
			for (i++; i < src.length && src[i] !== q; i++) if (src[i] === "\\") i++;
		} else if (ch === "[" || ch === "(" || ch === "{") depth++;
		else if (ch === "]" || ch === ")" || ch === "}") {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end < 0) return null;
	const before = src.slice(0, end).replace(/\s*$/, "");
	const comma = before.endsWith(",") || before.endsWith("[") ? "" : ",";
	const added = missing.map((p) => `\n\t\t${p.call}`).join(",");
	const next = `${before}${comma}${added}\n\t${src.slice(end)}`;
	// An app that already has caThemePlugin has its own `theme` import; only add ours with the plugin.
	const withImports = mergeViteImport(
		next,
		VITE_PLUGINS.filter((p) => next.includes(`${p.name}(`)).map((p) => p.name)
	);
	return missing.some((p) => p.name === "caThemePlugin")
		? addImport(withImports, `import { theme } from "${themeSpec}";`)
		: withImports;
}

const HOOKS_KIT_IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']@codeatlasdev\/ui\/kit["'];?/;

/** Add `names` to an existing `@codeatlasdev/ui/kit` import, or insert one. */
function mergeKitImport(src: string, names: string[]): string {
	const m = src.match(HOOKS_KIT_IMPORT);
	if (!m) return addImport(src, `import { ${names.join(", ")} } from "@codeatlasdev/ui/kit";`);
	const have = m[1]
		.split(",")
		.map((n) => n.trim())
		.filter(Boolean);
	const all = [...have, ...names.filter((n) => !have.includes(n))];
	return src.replace(m[0], `import { ${all.join(", ")} } from "@codeatlasdev/ui/kit";`);
}

const HANDLE_DEF = /export\s+(const|function|async function)\s+handle\b/;
const HANDLE_ERROR_DEF = /export\s+(const|function|async function)\s+handleError\b/;

/**
 * Adds what is missing, independently: the theme `handle` and the `handleError`. An app that already
 * defines either owns it: init never rewrites it (a missing `handle` next to an existing one is
 * reported as manual, since composing two pipelines is the app's call).
 */
function hooksPatch(themeSpec: string) {
	return (src: string): string | null => {
		const needHandle = !src.includes("caThemeHandle");
		const needError = !HANDLE_ERROR_DEF.test(src) && !src.includes("createErrorHandler");
		if (needHandle && HANDLE_DEF.test(src)) return null;
		if (!needHandle && !needError) return src;
		const kitNames = [
			...(needHandle ? ["caThemeHandle"] : []),
			...(needError ? ["createErrorHandler"] : []),
		];
		let out = src;
		if (needHandle) out = addImport(out, 'import { sequence } from "@sveltejs/kit/hooks";');
		out = mergeKitImport(out, kitNames);
		if (needHandle) out = addImport(out, `import { theme } from "${themeSpec}";`);
		out = out.replace(/\s*$/, "\n");
		if (needHandle) out += "\nexport const handle = sequence(caThemeHandle(theme));\n";
		if (needError) out += "\nexport const handleError = createErrorHandler();\n";
		return out;
	};
}

const hooksNew = (themeSpec: string) => `import { sequence } from "@sveltejs/kit/hooks";
import { caThemeHandle, createErrorHandler } from "@codeatlasdev/ui/kit";
import { theme } from "${themeSpec}";

// Puts the theme init script in every SSR/prerendered page so the first paint is already correct.
export const handle = sequence(caThemeHandle(theme));

// Sanitizes unexpected server errors (no stack or 5xx message reaches the user) and gives each an id.
export const handleError = createErrorHandler();
`;

/**
 * Default `<Seo>` of the root layout. `page` comes from `$app/state`: a layout may use it, a service
 * worker may not. The title is app copy (`src/lib/messages.ts`), so the layout passes the lint; the
 * manifest link exists only when `--with pwa` writes the manifest route (prerender 404s otherwise).
 */
const seoTag = (pwa: boolean) => `<Seo
	title={m.appTitle}
	canonical={page.url.origin + page.url.pathname}${pwa ? '\n\tmanifest="/manifest.webmanifest"' : ""}
/>`;

/**
 * `src/lib/messages.ts`: the app's visible copy, read by templates as \`{m.key}\` so
 * \`codeatlas-ui lint\` (i18n-literal) stays clean. Replace the object with your locale catalog when
 * the app is translated.
 */
const messagesNew = (pwa: boolean) => `export const m = {
	appTitle: "My app",${
		pwa
			? `
	offline: {
		title: "You are offline",
		body: "This page needs a connection. Check the network and try again.",
		retry: "Try again",
	},`
			: ""
	}
} as const;
`;

/** `--with pwa` after a plain init: the offline page reads \`m.offline\`, so the keys are added to init's own catalog. */
function messagesPatch(pwa: boolean) {
	return (src: string): string | null => {
		if (!pwa || /\boffline\s*:/.test(src)) return src;
		if (!/^export const m = \{\n\tappTitle: "My app",\n\} as const;\n$/.test(src)) return src;
		return messagesNew(true);
	};
}

const LAYOUT_TS = `export const prerender = true;\n`;

/** The viewport meta and the document skeleton Kit needs; no wrapper \`style\` (the lint forbids inline styles). */
const APP_HTML_NEW = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="${VIEWPORT}" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div>%sveltekit.body%</div>
	</body>
</html>
`;

/** `src/routes/manifest.webmanifest/+server.ts`: name from the app copy, colors from the app theme, icons from `static/icons`. */
const manifestRoute = (
	themeSpec: string,
	messagesSpec: string
) => `import { manifest } from "@codeatlasdev/ui/seo";
import { m } from "${messagesSpec}";
import { theme } from "${themeSpec}";

export const prerender = true;

// Icons: put the files in static/icons, or generate them from one SVG mark with caBrandPlugin
// (\`@codeatlasdev/ui/vite\`) and read the URLs from its generated module.
export const GET = () =>
	new Response(
		JSON.stringify(
			manifest({
				name: m.appTitle,
				theme,
				icons: [
					{ src: "/icons/192.png", sizes: "192x192" },
					{ src: "/icons/512.png", sizes: "512x512" },
					{ src: "/icons/maskable-512.png", sizes: "512x512", purpose: "maskable" },
				],
			})
		),
		{ headers: { "content-type": "application/manifest+json" } }
	);
`;

const ROBOTS_ROUTE = `import type { RequestHandler } from "@sveltejs/kit";
import { robotsTxt } from "@codeatlasdev/ui/seo";

export const prerender = true;

export const GET: RequestHandler = ({ url }) =>
	new Response(robotsTxt({ sitemap: \`\${url.origin}/sitemap.xml\` }), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
`;

/** Static pages only (no `[param]` segments; route-group parentheses are dropped, `/offline` is left out): dynamic routes need their own list. */
const SITEMAP_ROUTE = `import type { RequestHandler } from "@sveltejs/kit";
import { sitemapXml } from "@codeatlasdev/ui/seo";

export const prerender = true;

const pages = Object.keys(import.meta.glob("/src/routes/**/+page.svelte"))
	.map((file) => file.replace("/src/routes", "").replace(/\\/?\\+page\\.svelte$/, ""))
	.filter((path) => !path.includes("["))
	.map((path) => path.replace(/\\/\\([^)]*\\)/g, "") || "/")
	.filter((path) => path !== "/offline");

export const GET: RequestHandler = ({ url }) =>
	new Response(sitemapXml([...new Set(pages)].sort().map((path) => ({ loc: url.origin + path }))), {
		headers: { "content-type": "application/xml" },
	});
`;

const offlinePage = (messagesSpec: string) => `<script lang="ts">
	import { m } from "${messagesSpec}";
</script>

<h1>{m.offline.title}</h1>
<p>{m.offline.body}</p>
<button type="button" onclick={() => location.reload()}>{m.offline.retry}</button>
`;

const OFFLINE_PAGE_TS = `export const prerender = true;\n`;

const SW_HEAD = `/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
`;

/** Cache rules shared by both Kit majors: only \`ASSETS\` and the cache name differ. */
const SW_BODY = `
const CACHE = \`app-\${version}\`;
const ASSETS = [...BUILD, ...FILES, "/offline"];

sw.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Pages: network first, the cached offline page when the network fails.
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(async () => (await caches.match("/offline")) ?? Response.error())
		);
		return;
	}

	// Hashed build output and static files: cache first. API, auth and form actions are never touched.
	if (ASSETS.includes(url.pathname))
		event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});
`;

/** Kit 2: \`$service-worker\` exports \`build\`, \`files\` and \`version\`. */
const SW_KIT2 = `${SW_HEAD}import { build as BUILD, files as FILES, version } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;
${SW_BODY}`;

/**
 * Kit 3 removed \`$service-worker\`: \`self\` is typed by \`$app/service-worker\`, the file lists live in
 * \`$app/manifest\` and \`version\` in \`$app/env\`. \`$app/forms\`, \`/navigation\` and \`/state\` cannot be
 * imported into a worker (the build fails with \`service_worker_invalid_import\`).
 */
const SW_KIT3 = `${SW_HEAD}import { self as sw } from "$app/service-worker";
import { assets, immutable } from "$app/manifest";
import { version } from "$app/env";

const BUILD = immutable.map((f) => f.path);
const FILES = assets.map((f) => f.path);
${SW_BODY}`;

/** What the root layout depends on: where the app copy lives and whether the manifest route exists. */
interface LayoutOpts {
	messagesSpec: string;
	pwa: boolean;
}

const layoutNew = ({ messagesSpec, pwa }: LayoutOpts) => `<script lang="ts">
	import "@codeatlasdev/ui/styles/global.css";
	import { colorScheme } from "@codeatlasdev/ui";
	import { Seo } from "@codeatlasdev/ui/seo";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import { m } from "${messagesSpec}";

	let { children } = $props();

	onMount(() => colorScheme.init());
</script>

${seoTag(pwa)}

{@render children()}
`;

/**
 * The imports `<Seo>` needs in the root layout: a default title (app copy) and the page's own
 * canonical (origin + path, no query). A page overrides it with its own `<Seo>`, or passes `noindex`.
 */
function seoImports(src: string, messagesSpec: string): string[] {
	const lines: string[] = [];
	if (!/import\s*\{[^}]*\bSeo\b[^}]*\}\s*from\s*["']@codeatlasdev\/ui\/seo["']/.test(src))
		lines.push('\timport { Seo } from "@codeatlasdev/ui/seo";');
	if (!/import\s*\{[^}]*\bpage\b[^}]*\}\s*from\s*["']\$app\/state["']/.test(src))
		lines.push('\timport { page } from "$app/state";');
	if (!/import\s*\{[^}]*\bm\b[^}]*\}\s*from/.test(src))
		lines.push(`\timport { m } from "${messagesSpec}";`);
	return lines;
}

function layoutPatch({ messagesSpec, pwa }: LayoutOpts) {
	return (src: string): string | null => {
		let out = src;
		// `--with pwa` after a plain init: init's own `<Seo>` (its title is the app copy) gets the manifest link.
		if (pwa && !/manifest=/.test(out))
			out = out.replace(
				/(<Seo\s+title=\{m\.appTitle\}[^>]*?)(\s*\/>)/,
				'$1\n\tmanifest="/manifest.webmanifest"$2'
			);
		const needCss = !out.includes("@codeatlasdev/ui/styles/global.css");
		const needScheme = !/colorScheme\s*\.\s*init\s*\(/.test(out);
		const needSeo = !/<Seo\b/.test(out);
		if (!needCss && !needScheme && !needSeo) return out;
		const script = out.match(/<script\b[^>]*>/);
		if (!script || script.index === undefined) {
			return `<script lang="ts">\n\timport "@codeatlasdev/ui/styles/global.css";\n\timport { colorScheme } from "@codeatlasdev/ui";\n${seoImports(out, messagesSpec).join("\n")}\n\timport { onMount } from "svelte";\n\n\tonMount(() => colorScheme.init());\n</script>\n\n${seoTag(pwa)}\n\n${out}`;
		}
		const insertAt = script.index + script[0].length;
		const lines: string[] = [];
		if (needCss) lines.push('\timport "@codeatlasdev/ui/styles/global.css";');
		if (!/import\s*\{[^}]*\bcolorScheme\b[^}]*\}\s*from\s*["']@codeatlasdev\/ui["']/.test(out))
			lines.push('\timport { colorScheme } from "@codeatlasdev/ui";');
		if (needSeo) lines.push(...seoImports(out, messagesSpec));
		if (!/import\s*\{[^}]*\bonMount\b[^}]*\}\s*from\s*["']svelte["']/.test(out))
			lines.push('\timport { onMount } from "svelte";');
		out = `${out.slice(0, insertAt)}\n${lines.join("\n")}${out.slice(insertAt)}`;
		if (needScheme) {
			const close = out.indexOf("</script>");
			out = `${out.slice(0, close).replace(/\s*$/, "")}\n\n\tonMount(() => colorScheme.init());\n${out.slice(close)}`;
		}
		if (needSeo) {
			const close = out.indexOf("</script>") + "</script>".length;
			out = `${out.slice(0, close)}\n\n${seoTag(pwa)}${out.slice(close)}`;
		}
		return out;
	};
}

function appHtmlPatch(src: string): string | null {
	if (src.includes("viewport-fit=cover")) return src;
	const m = src.match(/<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/);
	if (!m) return null;
	return src.replace(m[0], `<meta name="viewport" content="${VIEWPORT}" />`);
}

/**
 * Kit 3 moved configuration into the `sveltekit(...)` Vite plugin and generates its tsconfig base
 * under `$app/tsconfig`. Both live in files the user owns, so init reports instead of rewriting.
 */
function kit3Notes(root: string): string[] {
	const notes: string[] = [];
	const config = ["svelte.config.js", "svelte.config.ts", "svelte.config.mjs"].find((f) =>
		existsSync(join(root, f))
	);
	if (config)
		notes.push(
			`SvelteKit 3 ignores ${config} (config_file_unsupported). Move its options out of the \`kit\` namespace and into the plugin in vite.config: \`sveltekit({ adapter, ... })\`, then delete ${config}.`
		);
	const tsconfig = join(root, "tsconfig.json");
	if (existsSync(tsconfig) && !readFileSync(tsconfig, "utf8").includes("$app/tsconfig"))
		notes.push(
			'SvelteKit 3 no longer generates .svelte-kit/tsconfig.json. Set `"extends": "$app/tsconfig"` in tsconfig.json (tsconfig_extends_missing); it already allows `.ts` import extensions, which vite.config needs.'
		);
	return notes;
}

/**
 * `@sveltejs/adapter-static` 4 peers on Kit 3 only and 3 on Kit 2; npm fails with ERESOLVE on a
 * mismatch. Said once, when the declared major is the wrong one.
 */
function adapterNotes(root: string): string[] {
	const adapter = adapterStatic(root);
	if (!adapter?.major) return [];
	const want = kitMajor(root) >= 3 ? 4 : 3;
	if (adapter.major === want) return [];
	return [
		`@sveltejs/adapter-static ${adapter.major} does not pair with SvelteKit ${kitMajor(root)}: install @sveltejs/adapter-static@${want} (4 needs Kit 3, 3 needs Kit 2).`,
	];
}

/**
 * What the scaffolded SEO/PWA files (`--with pwa`) still need from the app. Printed only when init
 * created them: the placeholder origin Kit uses while prerendering would otherwise reach the
 * sitemap, robots.txt and canonical URLs, the icons are files init cannot invent, and Kit refuses
 * to prerender `/robots.txt` and `/sitemap.xml` when no page links to them (`prerender_unseen_routes`)
 * unless `handleUnseenRoutes` says to ignore it.
 */
function pwaNotes(root: string, created: boolean): string[] {
	if (!created) return [];
	const kit3 = kitMajor(root) >= 3;
	const notes = [
		kit3
			? 'Set your public origin: `sveltekit({ paths: { origin: "https://example.com" } })` in vite.config. While prerendering Kit uses a placeholder one, and it would end up in sitemap.xml, robots.txt and every canonical URL.'
			: 'Set your public origin: `kit: { prerender: { origin: "https://example.com" } }` in svelte.config.js (Kit 2 has no `paths.origin`). While prerendering Kit uses a placeholder one, and it would end up in sitemap.xml, robots.txt and every canonical URL.',
		"Add the manifest icons (static/icons/192.png, 512.png, maskable-512.png), or generate them from one SVG with caBrandPlugin (`@codeatlasdev/ui/vite`).",
	];
	const vite = join(root, "vite.config.ts");
	const svelteConfig = join(root, "svelte.config.js");
	const configFile = kit3 ? vite : svelteConfig;
	if (!existsSync(configFile) || !readFileSync(configFile, "utf8").includes("handleUnseenRoutes"))
		notes.push(
			kit3
				? 'Add `prerender: { handleUnseenRoutes: "ignore" }` to `sveltekit({ ... })` in vite.config: no page links to /robots.txt or /sitemap.xml, and the build fails with prerender_unseen_routes otherwise.'
				: 'Add `prerender: { handleUnseenRoutes: "ignore" }` under `kit` in svelte.config.js: no page links to /robots.txt or /sitemap.xml, and the build fails with prerender_unseen_routes otherwise.'
		);
	return notes;
}

/** The step that would create the app's theme file, or the explanation that init keeps the app's own. */
function themeStep(path: string, create: string, existing: string | null): Step {
	return existing
		? {
				path,
				note: `the app already imports its theme from "${existing}"; init keeps that existing theme.`,
			}
		: { path, create };
}

/** `vite.config.ts` for a bare Kit app: the two plugins, plus the static adapter and prerender option when they apply. */
function viteConfigNew(root: string, themeSpec: string, pwa: boolean): string {
	const adapter = adapterStatic(root);
	const kit3 = kitMajor(root) >= 3;
	const options = [
		adapter && kit3 ? "adapter: adapter()" : "",
		pwa && kit3 ? 'prerender: { handleUnseenRoutes: "ignore" }' : "",
	].filter(Boolean);
	return `import { sveltekit } from "@sveltejs/kit/vite";
${adapter && kit3 ? 'import adapter from "@sveltejs/adapter-static";\n' : ""}import { caErrorPlugin, caThemePlugin } from "@codeatlasdev/ui/vite";
import { defineConfig } from "vite";
import { theme } from "${themeSpec}";

export default defineConfig({
	plugins: [sveltekit(${options.length ? `{ ${options.join(", ")} }` : ""}), caThemePlugin(theme), caErrorPlugin({ scaffold: true, theme })],
});
`;
}

/**
 * What init wants in tsconfig.json. Kit 3's `$app/tsconfig` base already allows `.ts` import
 * extensions (vite.config imports the theme with one) and skips library checks; Kit 2's generated
 * `.svelte-kit/tsconfig.json` does neither, so svelte-check fails on vite.config and on the
 * `.d.ts` files of node_modules. `exclude` keeps svelte-check out of the adapter-static output
 * (`build/`), which it would scan as minified JS and report thousands of errors for.
 */
function tsconfigWants(root: string, exclude: string[]) {
	const kit3 = kitMajor(root) >= 3;
	return {
		extends: kit3 ? "$app/tsconfig" : "./.svelte-kit/tsconfig.json",
		options: kit3 ? {} : { allowImportingTsExtensions: true, noEmit: true, skipLibCheck: true },
		exclude,
	};
}

/** `tsconfig.json` for a bare app. */
function tsconfigNew(root: string, exclude: string[]): string {
	const { extends: base, options, exclude: ex } = tsconfigWants(root, exclude);
	const config = {
		extends: base,
		...(Object.keys(options).length ? { compilerOptions: options } : {}),
		...(ex.length ? { exclude: ex } : {}),
	};
	return `${JSON.stringify(config, null, "\t")}\n`;
}

/**
 * Adds what is missing to an existing tsconfig.json without rewriting the rest: `exclude` entries
 * are appended and compiler options are only set when the app has not set them (an explicit
 * `skipLibCheck: false` stays). A tsconfig with comments or trailing commas is not strict JSON, so
 * init leaves it and reports `manual`.
 */
function tsconfigPatch(root: string, exclude: string[]) {
	const wants = tsconfigWants(root, exclude);
	return (src: string): string | null => {
		let config: { compilerOptions?: Record<string, unknown>; exclude?: string[] };
		try {
			config = JSON.parse(src);
		} catch {
			return null;
		}
		const options = { ...config.compilerOptions };
		for (const [k, v] of Object.entries(wants.options)) options[k] ??= v;
		const have = config.exclude ?? [];
		const missing = wants.exclude.filter((e) => !have.includes(e));
		const sameOptions =
			Object.keys(options).length === Object.keys(config.compilerOptions ?? {}).length;
		if (!missing.length && sameOptions) return src;
		const next = {
			...config,
			...(Object.keys(options).length ? { compilerOptions: options } : {}),
			...(missing.length ? { exclude: [...have, ...missing] } : {}),
		};
		const indent = src.match(/^(\s+)"/m)?.[1] ?? "\t";
		return `${JSON.stringify(next, null, indent)}\n`;
	};
}

/** `src/routes/+layout.ts` for a static deploy: without `prerender` adapter-static emits only the SPA fallback. */
function layoutTsPatch(src: string): string | null {
	if (/export\s+const\s+prerender\b/.test(src)) return src;
	return `${src.replace(/\s*$/, "")}\n\n${LAYOUT_TS}`.replace(/^\n+/, "");
}

/**
 * AGENTS.md for the app's own agents: the consumer guide between markers. A file without the markers
 * gets the block appended; one with them has only that block replaced, so the app's own rules stay.
 */
export function agentsStep(): Step {
	const block = `${GUIDE_START}\n${CONSUMER_GUIDE.trim()}\n${GUIDE_END}\n`;
	return {
		path: "AGENTS.md",
		create: block,
		patch: (src) => {
			const start = src.indexOf(GUIDE_START);
			const end = src.indexOf(GUIDE_END);
			if (start >= 0 && end > start) {
				return `${src.slice(0, start)}${block.trimEnd()}${src.slice(end + GUIDE_END.length)}`;
			}
			return `${src.trimEnd()}\n\n${block}`;
		},
	};
}

function sveltekitSteps(root: string, pwa: boolean): Step[] {
	const existing = existingThemeSpec(
		root,
		["vite.config.ts", "src/hooks.server.ts"],
		"src/lib/theme.ts"
	);
	const themeSpec = existing ?? libImport(root, "theme");
	const messagesSpec = libImport(root, "messages");
	const kit3 = kitMajor(root) >= 3;
	const adapter = adapterStatic(root);
	// What svelte-check must not scan: the adapter output, and on Kit 3 the worker (own tsconfig).
	const exclude = [adapter?.dir, pwa && kit3 ? "src/service-worker" : undefined].filter(
		(e): e is string => !!e
	);
	const steps: Step[] = [
		{
			path: "package.json",
			patch: kitPackagePatch(kit3),
			manual: `Add \`"scripts": { "prepare": "svelte-kit sync" }\`${kit3 ? ' and `"imports": { "#lib/*": "./src/lib/*" }`' : ""} to package.json.`,
		},
		themeStep("src/lib/theme.ts", THEME_TS, existing),
		{ path: "src/lib/messages.ts", create: messagesNew(pwa), patch: messagesPatch(pwa) },
		{
			path: "src/hooks.server.ts",
			create: hooksNew(themeSpec),
			patch: hooksPatch(themeSpec),
			manual:
				'Compose caThemeHandle(theme) from "@codeatlasdev/ui/kit" into your existing `handle` with sequence().',
		},
		{
			path: "vite.config.ts",
			create: viteConfigNew(root, existing ?? "./src/lib/theme.ts", pwa),
			patch: (src) => viteConfigPatch(src, existing ?? "./src/lib/theme.ts"),
			manual: 'Add caThemePlugin(theme) from "@codeatlasdev/ui/vite" to `plugins`.',
		},
		{
			path: "src/routes/+layout.svelte",
			create: layoutNew({ messagesSpec, pwa }),
			patch: layoutPatch({ messagesSpec, pwa }),
		},
		{
			path: "tsconfig.json",
			create: tsconfigNew(root, exclude),
			patch: tsconfigPatch(root, exclude),
			manual: `In tsconfig.json: add ${exclude.map((e) => `"${e}"`).join(", ")} to "exclude"${kit3 ? "" : ", and set compilerOptions allowImportingTsExtensions, noEmit and skipLibCheck to true"}.`,
		},
		...(adapter
			? [
					{
						path: "src/routes/+layout.ts",
						create: LAYOUT_TS,
						patch: layoutTsPatch,
					},
				]
			: []),
		{
			path: "src/app.html",
			create: APP_HTML_NEW,
			patch: appHtmlPatch,
			manual: `Set the viewport meta to: ${VIEWPORT}`,
		},
		agentsStep(),
	];
	if (!pwa) return steps;
	return [
		...steps,
		{
			path: "src/routes/manifest.webmanifest/+server.ts",
			create: manifestRoute(themeSpec, messagesSpec),
		},
		{ path: "src/routes/robots.txt/+server.ts", create: ROBOTS_ROUTE },
		{ path: "src/routes/sitemap.xml/+server.ts", create: SITEMAP_ROUTE },
		{ path: "src/routes/offline/+page.svelte", create: offlinePage(messagesSpec) },
		{ path: "src/routes/offline/+page.ts", create: OFFLINE_PAGE_TS },
		// Kit 3 reads `src/service-worker/index.ts`, Kit 2 `src/service-worker.ts`: never both.
		kit3
			? { path: "src/service-worker/index.ts", create: SW_KIT3 }
			: { path: "src/service-worker.ts", create: SW_KIT2 },
	];
}

// ── Opt-in extras (`init --with lint,e2e,pwa`) ───────────────────────────────

/** Templates that add files and package.json scripts; `pwa` only switches the SvelteKit steps. */
const PACKAGE_FEATURES = ["lint", "e2e"] as const;
type PackageFeature = (typeof PACKAGE_FEATURES)[number];
export const WITH_FEATURES = [...PACKAGE_FEATURES, "pwa"] as const;

const GUARD_CONFIG = `{
\t"allow": []
}
`;

const PLAYWRIGHT_CONFIG = `import { defineConfig, devices } from "@playwright/test";

// One project per width: the library's breakpoints are 600/900/1200, so 390 is a phone,
// 768 a tablet and 1280 a laptop.
const widths = [390, 768, 1280];

export default defineConfig({
\ttestDir: "./e2e",
\tfullyParallel: true,
\tforbidOnly: !!process.env.CI,
\tretries: process.env.CI ? 1 : 0,
\treporter: process.env.CI ? "github" : "list",
\tuse: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
\twebServer: { command: "bun run build && bun run preview --port 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
\tprojects: widths.map((width) => ({
\t\tname: \`w\${width}\`,
\t\tuse: { ...devices["Desktop Chrome"], viewport: { width, height: width < 600 ? 844 : 800 }, hasTouch: width < 600 },
\t})),
});
`;

const A11Y_SPEC = `import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every route worth checking, in both schemes. Add the routes of your app.
const routes = ["/"];

for (const route of routes)
\tfor (const scheme of ["light", "dark"] as const)
\t\ttest(\`no axe violations: \${route} (\${scheme})\`, async ({ page }) => {
\t\t\tawait page.emulateMedia({ colorScheme: scheme });
\t\t\tawait page.goto(route);
\t\t\tconst { violations } = await new AxeBuilder({ page }).analyze();
\t\t\texpect(violations).toEqual([]);
\t\t});
`;

/** Scripts and dev dependencies each feature adds; an existing key is never overwritten. */
const WITH_PACKAGE: Record<
	PackageFeature,
	{ scripts: Record<string, string>; devDependencies: Record<string, string> }
> = {
	lint: {
		scripts: {
			"lint:ui": "codeatlas-ui lint src",
			"check:ca": "codeatlas-ui workarounds --strict src",
		},
		devDependencies: {},
	},
	e2e: {
		scripts: { "test:e2e": "playwright test" },
		devDependencies: { "@playwright/test": "^1.50.0", "@axe-core/playwright": "^4.10.0" },
	},
};

function packagePatch(features: readonly PackageFeature[]) {
	return (src: string): string | null => {
		const pkg = JSON.parse(src);
		const scripts = { ...pkg.scripts };
		const dev = { ...pkg.devDependencies };
		for (const f of features) {
			for (const [k, v] of Object.entries(WITH_PACKAGE[f].scripts)) scripts[k] ??= v;
			for (const [k, v] of Object.entries(WITH_PACKAGE[f].devDependencies))
				if (!pkg.dependencies?.[k]) dev[k] ??= v;
		}
		const next = { ...pkg, scripts, devDependencies: dev };
		if (!Object.keys(scripts).length) delete next.scripts;
		if (!Object.keys(dev).length) delete next.devDependencies;
		const indent = src.match(/^(\s+)"/m)?.[1] ?? "\t";
		return `${JSON.stringify(next, null, indent)}\n`;
	};
}

function withSteps(features: readonly PackageFeature[]): Step[] {
	const steps: Step[] = [];
	if (features.includes("lint")) steps.push({ path: "ui-guard.config.json", create: GUARD_CONFIG });
	if (features.includes("e2e"))
		steps.push(
			{ path: "playwright.config.ts", create: PLAYWRIGHT_CONFIG },
			{ path: "e2e/a11y.spec.ts", create: A11Y_SPEC }
		);
	steps.push({
		path: "package.json",
		patch: packagePatch(features),
		manual: "Add the scripts and dev dependencies by hand.",
	});
	return steps;
}

// ── Astro ─────────────────────────────────────────────────────────────────────

function astroConfigPatch(src: string, themeSpec: string): string | null {
	const hasCaUI = src.includes("caUI(");
	// The components are Svelte: without the Svelte integration they do not render (#273).
	const hasSvelte = /\bsvelte\s*\(/.test(src);
	if (hasCaUI && hasSvelte) return src;
	const m = src.match(/integrations:\s*\[/);
	if (!m || m.index === undefined) return null;
	const at = m.index + m[0].length;
	const rest = src.slice(at);
	const items = [hasCaUI ? "" : "caUI(theme)", hasSvelte ? "" : "svelte()"].filter(Boolean);
	let next = `${src.slice(0, at)}${items.join(", ")}${/^\s*\]/.test(rest) ? "" : ", "}${rest}`;
	if (!hasSvelte) next = addImport(next, 'import svelte from "@astrojs/svelte";');
	if (!hasCaUI) {
		next = addImport(next, 'import { caUI } from "@codeatlasdev/ui/astro";');
		next = addImport(next, `import { theme } from "${themeSpec}";`);
	}
	return next;
}

/** `@astrojs/svelte` is a peer the user installs: init edits the config but cannot run the package manager. */
function astroNotes(root: string): string[] {
	if (readDeps(root)?.["@astrojs/svelte"]) return [];
	return [
		"@astrojs/svelte is not in package.json, and the components need it. Install it with `npx astro add svelte`.",
	];
}

const ASTRO_LAYOUT = `---
import "@codeatlasdev/ui/styles/global.css";
---
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="${VIEWPORT}" />
		<title>My app</title>
	</head>
	<body>
		<slot />
		<script>
			// One store instance for the page: theme switches and OS scheme changes stay in sync.
			import { colorScheme } from "@codeatlasdev/ui";
			colorScheme.init();
		</script>
	</body>
</html>
`;

function astroLayoutPatch(src: string): string | null {
	let out = src;
	if (!out.includes("@codeatlasdev/ui/styles/global.css")) {
		const fm = out.match(/^---\n/);
		out = fm
			? out.replace(/^---\n/, '---\nimport "@codeatlasdev/ui/styles/global.css";\n')
			: `---\nimport "@codeatlasdev/ui/styles/global.css";\n---\n${out}`;
	}
	if (!out.includes("viewport-fit=cover")) {
		const m = out.match(/<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/);
		if (m) out = out.replace(m[0], `<meta name="viewport" content="${VIEWPORT}" />`);
	}
	if (!/colorScheme\s*\.\s*init\s*\(/.test(out)) {
		const script = `\t\t<script>\n\t\t\timport { colorScheme } from "@codeatlasdev/ui";\n\t\t\tcolorScheme.init();\n\t\t</script>\n`;
		if (!out.includes("</body>")) return null;
		out = out.replace("</body>", `${script}\t</body>`);
	}
	return out;
}

/** First `.astro` file under src/layouts that renders `<html>`: the document shell to patch. */
function findAstroLayout(root: string): string | null {
	const dir = join(root, "src/layouts");
	if (!existsSync(dir)) return null;
	for (const f of readdirSync(dir)) {
		if (f.endsWith(".astro") && /<html[\s>]/.test(readFileSync(join(dir, f), "utf8")))
			return `src/layouts/${f}`;
	}
	return null;
}

function astroSteps(root: string): Step[] {
	const configName =
		["astro.config.mjs", "astro.config.ts", "astro.config.js", "astro.config.mts"].find((f) =>
			existsSync(join(root, f))
		) ?? "astro.config.mjs";
	const layout = findAstroLayout(root);
	const existing = existingThemeSpec(root, [configName], "src/theme.ts");
	return [
		themeStep("src/theme.ts", ASTRO_THEME_TS, existing),
		{
			path: configName,
			patch: (src) => astroConfigPatch(src, existing ?? "./src/theme.ts"),
			manual:
				'Add caUI(theme) from "@codeatlasdev/ui/astro" and svelte() from "@astrojs/svelte" to `integrations`.',
		},
		layout
			? {
					path: layout,
					patch: astroLayoutPatch,
					manual: `Import "@codeatlasdev/ui/styles/global.css", set the viewport to "${VIEWPORT}" and call colorScheme.init() in a client <script>.`,
				}
			: { path: "src/layouts/Base.astro", create: ASTRO_LAYOUT },
		agentsStep(),
	];
}

// ── runner ────────────────────────────────────────────────────────────────────

export interface InitOptions {
	/** Apply the setup. Without it nothing touches the disk: new files and diffs are only reported. */
	write?: boolean;
	/** Opt-in extras: `lint` (UI guard scripts) and `e2e` (Playwright matrix and axe spec). */
	with?: string[];
	log?: (line: string) => void;
}

/** Returns false when the project type is unknown or an existing file could not be patched. */
export function init(
	root: string,
	{ write = false, with: extras = [], log = console.log }: InitOptions = {}
): boolean {
	const unknown = extras.find((f) => !(WITH_FEATURES as readonly string[]).includes(f));
	if (unknown) {
		log(`unknown --with value "${unknown}" (expected: ${WITH_FEATURES.join(", ")})`);
		return false;
	}
	const pwa = extras.includes("pwa");
	const other = extras.filter((f): f is PackageFeature =>
		(PACKAGE_FEATURES as readonly string[]).includes(f)
	);
	const fw = detectFramework(root);
	if (!fw) {
		log(
			"No SvelteKit or Astro project found (package.json needs @sveltejs/kit or astro). Run this in the project root."
		);
		return false;
	}
	log(`Detected ${fw === "sveltekit" ? "SvelteKit" : "Astro"}.\n`);

	let ok = true;
	let pending = 0;
	let createdManifest = false;
	const base = fw === "sveltekit" ? sveltekitSteps(root, pwa) : astroSteps(root);
	for (const step of other.length ? [...base, ...withSteps(other)] : base) {
		if (step.note) {
			log(`  skip    ${step.path}: ${step.note}`);
			continue;
		}
		const abs = join(root, step.path);
		if (!existsSync(abs)) {
			if (step.create === undefined) {
				log(`  skip    ${step.path} (not found)`);
				if (step.manual) log(`          ${step.manual}`);
				continue;
			}
			if (write) {
				mkdirSync(dirname(abs), { recursive: true });
				writeFileSync(abs, step.create);
				createdManifest ||= step.path.endsWith("manifest.webmanifest/+server.ts");
				log(`  create  ${step.path}`);
			} else {
				pending++;
				log(`  would create  ${step.path}`);
			}
			continue;
		}
		const current = readFileSync(abs, "utf8");
		const next = step.patch?.(current);
		if (next === undefined || next === current) {
			log(`  ok      ${step.path} (already set up)`);
		} else if (next === null) {
			ok = false;
			log(`  manual  ${step.path}: could not patch safely. ${step.manual ?? ""}`);
		} else if (write) {
			writeFileSync(abs, next);
			log(`  patch   ${step.path}`);
		} else {
			pending++;
			log(
				`  diff    ${step.path} (exists, not modified)\n${unifiedDiff(relative(root, abs), current, next)}\n`
			);
		}
	}
	if (pending)
		log(
			`\n${pending} change(s) not applied. Re-run with --write to create the files and apply the diffs above.`
		);
	const notes = [
		...(fw === "sveltekit" && kitMajor(root) >= 3 ? kit3Notes(root) : []),
		...(fw === "sveltekit" ? [...adapterNotes(root), ...pwaNotes(root, createdManifest)] : []),
		...(fw === "astro" ? astroNotes(root) : []),
	];
	for (const n of notes) log(`\n  note    ${n}`);
	if (ok && !pending && !notes.length)
		log("\nDone. Run your dev server: the theme paints on the first frame.");
	return ok;
}

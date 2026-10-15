/**
 * Vite plugins for @codeatlasdev/ui.
 *
 * caThemePlugin  — FOUC prevention. Plain Vite apps: injects the theme head via
 *                  transformIndexHtml. SvelteKit apps: the hook is removed (Kit
 *                  never serves index.html and Kit 3 rejects it); the theme comes
 *                  from caThemeHandle in hooks.server or from src/app.html, and
 *                  the build warns when neither is present.
 *
 * caErrorPlugin  — Warns when +error.svelte / error.html are missing.
 *                  Pass `scaffold: true` to auto-create them once.
 *
 * caBrandPlugin  — Renders hashed favicon / apple-touch / manifest icons from one mark SVG and
 *                  the theme (optional peers: @resvg/resvg-js, png-to-ico). See brand.ts.
 *
 * Recommended setup for SvelteKit projects:
 *
 *   // vite.config.ts
 *   import { caThemePlugin } from '@codeatlasdev/ui/vite';
 *   export default { plugins: [sveltekit(), caThemePlugin()] };
 *
 *   // src/app.html — add once, commit it:
 *   <head>
 *     <script id="ca-theme-init">THEME_SCRIPT_HERE</script>
 *     ...
 *
 *   // OR src/hooks.server.ts (works without touching app.html):
 *   import { sequence } from '@sveltejs/kit/hooks';
 *   import { caThemeHandle } from '@codeatlasdev/ui/kit';
 *   export const handle = sequence(caThemeHandle());
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { SSR_NO_EXTERNAL } from "./theme/define.js";
import { CA_THEME_MARKER, THEME_SCRIPT, type ThemeOptions, themeHead } from "./theme-script.js";

export type {
	BrandAssets,
	BrandColors,
	CaBrandPluginOptions,
	GenerateBrandOptions,
	ResolvedBrand,
} from "./brand.js";
export {
	brandHash,
	caBrandPlugin,
	faviconSvg,
	generateBrand,
	renderMark,
	resolveBrand,
} from "./brand.js";
// Node-side build tooling (astro.config, prebuild scripts) cannot import the `seo` barrel: it re-exports
// `Seo.svelte`, which Node does not load. The social-card renderers are plain TypeScript, so re-export them here.
export type { BrowserLike, OgCardOptions } from "./seo/og.js";
export { OG_SIZE, ogCard, renderOgImage } from "./seo/og.js";
export type {
	FontDescriptor,
	FontSpec,
	PresetDefinition,
	ResolvedTheme,
	ThemeDefinition,
} from "./theme/define.js";
export type { ThemeOptions } from "./theme-script.js";
export { CA_THEME_MARKER };
/** Ready-to-paste script tag for src/app.html (default amber/dark theme). */
export const CA_THEME_SCRIPT_TAG = `<script id="${CA_THEME_MARKER}">${THEME_SCRIPT}</script>`;

// ── caThemePlugin ─────────────────────────────────────────────────────────────

/**
 * Pass the same options as caThemeHandle so the dev HTML (transformIndexHtml)
 * matches the SSR/prerendered HTML.
 */
export function caThemePlugin(options: ThemeOptions = {}): Plugin {
	const head = themeHead(options);
	let root = "";
	let isBuild = false;

	const plugin: Plugin = {
		name: "codeatlasdev-ui:theme",
		// "pre" so configResolved runs before SvelteKit inspects plugins (below).
		enforce: "pre",

		// @tanstack/svelte-table ships .svelte imports without extensions and shiki
		// is ESM-only; both must be bundled by Vite instead of Node's SSR resolver.
		config() {
			return {
				ssr: { noExternal: SSR_NO_EXTERNAL },
			};
		},

		configResolved(config) {
			root = config.root;
			isBuild = config.command === "build";
			// SvelteKit never serves index.html: the theme reaches its pages through
			// caThemeHandle (SSR, dev and build). Kit 3 also warns on any plugin that
			// declares transformIndexHtml, so drop the hook in SvelteKit apps and keep
			// it for plain Vite apps.
			if (config.plugins.some((p) => p.name === "vite-plugin-sveltekit-setup")) {
				delete plugin.transformIndexHtml;
			}
		},

		// Dev server: inject on-the-fly. Works because Vite's dev server
		// passes every served HTML through transformIndexHtml.
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				if (html.includes(CA_THEME_MARKER)) return html;
				return html.replace("<head>", `<head>${head}`);
			},
		},

		// Build: warn if neither hooks.server nor app.html injects the script.
		// We do NOT mutate source files — that creates dirty git state.
		buildStart() {
			if (!isBuild) return;
			for (const name of ["hooks.server.ts", "hooks.server.js"]) {
				const hooksPath = join(root, "src", name);
				if (existsSync(hooksPath) && readFileSync(hooksPath, "utf-8").includes("caThemeHandle")) {
					return;
				}
			}
			const appHtmlPath = join(root, "src", "app.html");
			if (!existsSync(appHtmlPath)) return;
			const html = readFileSync(appHtmlPath, "utf-8");
			if (html.includes(CA_THEME_MARKER)) return;

			console.warn(
				"\n[codeatlasdev/ui] ⚠  FOUC warning: theme script not injected\n" +
					"  transformIndexHtml does not run for SvelteKit prerendered/SSR output.\n" +
					"  Fix — choose one:\n\n" +
					"  A) Add to src/hooks.server.ts (recommended, no app.html changes needed):\n" +
					"     import { sequence } from '@sveltejs/kit/hooks';\n" +
					"     import { caThemeHandle } from '@codeatlasdev/ui/kit';\n" +
					"     export const handle = sequence(caThemeHandle());\n\n" +
					"  B) Add to src/app.html (one-time):\n" +
					`     <head>\n       ${CA_THEME_SCRIPT_TAG}\n       ...\n`
			);
		},
	};
	return plugin;
}

// ── caErrorPlugin ─────────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync } from "node:fs";

export interface CaErrorPluginOptions {
	root?: string;
	/** @default 'src/routes' */
	routesDir?: string;
	/**
	 * Write default +error.svelte and src/error.html if absent.
	 * Files are NEVER overwritten. Default: false (warn only).
	 */
	scaffold?: boolean;
	/** Whether to also scaffold src/error.html. Only used when scaffold:true. @default true */
	scaffoldErrorHtml?: boolean;
}

/** Vite plugin: at build start, warns when `+error.svelte` (and `src/error.html`) are missing from the app; with `scaffold: true` it writes default ones once and never overwrites existing files. */
export function caErrorPlugin(options: CaErrorPluginOptions = {}): Plugin {
	const { routesDir = "src/routes", scaffold = false, scaffoldErrorHtml = true } = options;

	const templateDir = resolve(dirname(fileURLToPath(import.meta.url)), "kit/templates");

	let root = options.root ?? "";

	return {
		name: "codeatlasdev-ui:error-pages",

		configResolved(config) {
			if (!root) root = config.root;
		},

		buildStart() {
			checkOrScaffold(root, routesDir, templateDir, scaffold, scaffoldErrorHtml);
		},

		configureServer() {
			return () => {
				checkOrScaffold(root, routesDir, templateDir, scaffold, scaffoldErrorHtml);
			};
		},
	};
}

function checkOrScaffold(
	root: string,
	routesDir: string,
	templateDir: string,
	scaffold: boolean,
	scaffoldErrorHtml: boolean
): void {
	const errorPageDest = join(root, routesDir, "+error.svelte");
	const errorHtmlDest = join(root, "src", "error.html");

	if (!existsSync(errorPageDest)) {
		if (scaffold) {
			const src = join(templateDir, "+error.svelte");
			if (existsSync(src)) {
				ensureDir(dirname(errorPageDest));
				writeFileSync(errorPageDest, readFileSync(src, "utf-8"), "utf-8");
				console.info(
					`\n[codeatlasdev/ui] Scaffolded ${routesDir}/+error.svelte\n  Create your own to customise.\n`
				);
			}
		} else {
			console.warn(
				`\n[codeatlasdev/ui] No +error.svelte at ${routesDir}/\n` +
					`  Quick start:\n\n` +
					`    <script>\n` +
					`      import { ErrorPage } from '@codeatlasdev/ui';\n` +
					`      import { page } from '$app/state';\n` +
					`    </script>\n` +
					`    <ErrorPage status={page.status} message={page.error?.message} />\n\n` +
					`  Or: caErrorPlugin({ scaffold: true })\n`
			);
		}
	}

	if (scaffoldErrorHtml && scaffold && !existsSync(errorHtmlDest)) {
		const src = join(templateDir, "error.html");
		if (existsSync(src)) {
			ensureDir(dirname(errorHtmlDest));
			writeFileSync(errorHtmlDest, readFileSync(src, "utf-8"), "utf-8");
			console.info(
				`\n[codeatlasdev/ui] Scaffolded src/error.html\n  Edit freely — won't be overwritten.\n`
			);
		}
	}
}

function ensureDir(dir: string): void {
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

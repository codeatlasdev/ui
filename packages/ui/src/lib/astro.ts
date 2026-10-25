/**
 * Astro integration for @codeatlasdev/ui.
 *
 *   // astro.config.mjs
 *   import svelte from "@astrojs/svelte";
 *   import { caUI } from "@codeatlasdev/ui/astro";
 *   export default defineConfig({ integrations: [svelte(), caUI(theme)] });
 *
 * - Paints the theme before first frame: brand preset CSS + init script are the FIRST children of
 *   `<head>` on every page, ahead of every bundled stylesheet (same output as caThemeHandle for SvelteKit).
 *   Astro renders its own `<style>` tags before `injectScript("head-inline")` scripts, so this is done
 *   by a middleware that rewrites the rendered page (`astro-middleware.js`).
 * - Keeps the theme across `<ClientRouter />` (View Transitions) navigations.
 * - Bundles the ESM-only/extensionless deps for SSR (tanstack table, shiki).
 *
 * Import `@codeatlasdev/ui/styles/global.css` once in your base layout.
 */
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { warnPresetContrast } from "./theme/contrast.js";
import { defineTheme, SSR_NO_EXTERNAL } from "./theme/define.js";
import { type ThemeOptions, themeHead } from "./theme-script.js";

/**
 * `<ClientRouter />` (View Transitions) replaces `<head>` and the `<html>` attributes with the next
 * document's, which only holds the head scripts, not what they created. Before each swap, copy the
 * live theme (style tags, theme-color meta, `<html>` theme attributes) onto the incoming document so
 * the swap keeps them. Registered once per page load.
 */
const THEME_PERSIST_SCRIPT = /* js */ `(function(){
if(window.__caThemePersist)return;window.__caThemePersist=1;
document.addEventListener('astro:before-swap',function(e){
var n=e.newDocument,h=document.documentElement,r=n.documentElement;
['ca-theme','ca-runtime-tokens'].forEach(function(id){
  var c=document.getElementById(id),o=n.getElementById(id);
  if(o)o.remove();
  if(c)n.head.appendChild(c.cloneNode(true))});
var m=document.querySelector('meta[name="theme-color"]'),p=n.querySelector('meta[name="theme-color"]');
if(p)p.remove();
if(m)n.head.appendChild(m.cloneNode(true));
var isl=h.hasAttribute('data-ca-island'),nextIsl=r.hasAttribute('data-ca-island');
var d=h.classList.contains('dark'),p=h.getAttribute('data-preset');
if(isl){var ad=h.getAttribute('data-ca-app-dark'),ap=h.getAttribute('data-ca-app-preset');
  if(ad!==null)d=ad==='1';if(ap!==null)p=ap}
if(nextIsl){r.setAttribute('data-ca-app-dark',d?'1':'0');if(p!==null)r.setAttribute('data-ca-app-preset',p)}
else{r.classList.toggle('dark',d);if(p===null)r.removeAttribute('data-preset');else r.setAttribute('data-preset',p)}
r.classList.toggle('ca-init',h.classList.contains('ca-init'));
['data-style','data-ca-scheme','data-ca-style','data-ca-live'].forEach(function(a){
  var v=h.getAttribute(a);
  if(v===null)r.removeAttribute(a);else r.setAttribute(a,v)})
})})();`;

/** Virtual module the middleware imports: the markup to put first in `<head>`. */
const HEAD_MODULE = "virtual:codeatlas-ui/head";

/**
 * Markup for the start of `<head>`: font preloads, the theme `<style>`, the init script and the
 * `<ClientRouter />` persistence script. The same pieces `caThemeHandle` emits for SvelteKit, plus
 * the persistence script.
 */
export function astroHead(options: ThemeOptions = {}): string {
	return `${themeHead(options)}<script id="ca-theme-persist">${THEME_PERSIST_SCRIPT}</script>`;
}

/**
 * `caUI(theme, { head })`: extra markup (a site's own boot script) placed right after the theme
 * markup, still ahead of every stylesheet. One middleware, one order, no second integration to race.
 */
export interface CaUIAstroOptions {
	head?: string;
}

/** Registers `markup` to be inserted first in `<head>` of every page, ahead of any bundled CSS. */
function headFirstHooks(markup: string) {
	return ({
		addMiddleware,
		updateConfig,
	}: Parameters<AstroIntegration["hooks"]["astro:config:setup"] & {}>[0]) => {
		updateConfig({
			vite: {
				plugins: [
					{
						name: "@codeatlasdev/ui:head",
						resolveId: (id) => (id === HEAD_MODULE ? `\0${HEAD_MODULE}` : null),
						load: (id) =>
							id === `\0${HEAD_MODULE}` ? `export default ${JSON.stringify(markup)};` : null,
					},
				],
				ssr: { noExternal: SSR_NO_EXTERNAL },
			},
		});
		addMiddleware({
			order: "pre",
			entrypoint: fileURLToPath(new URL("./astro-middleware.js", import.meta.url)),
		});
	};
}

/** Astro integration: puts the theme (preset CSS, fonts, init script) FIRST in every page `<head>`, ahead of every stylesheet, so the first paint wears the right theme, and bundles the ESM-only dependencies for SSR. Pass the same `ThemeOptions` as `defineTheme`. */
export function caUI(
	options: ThemeOptions = {},
	{ head = "" }: CaUIAstroOptions = {}
): AstroIntegration {
	warnPresetContrast(defineTheme(options), "caUI");
	return {
		name: "@codeatlasdev/ui",
		hooks: { "astro:config:setup": headFirstHooks(astroHead(options) + head) },
	};
}

export type { Paper, PresetDefinition, PresetSizes, SchemeColors } from "./theme/define.js";
export type { DesignStyleId } from "./theme/styles.js";
// Recipes are plain data: safe to import from astro.config (no Svelte runes on this path).
export { DESIGN_STYLES, designStyle, mergeTheme } from "./theme/styles.js";
export type { ThemeOptions };

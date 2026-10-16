/**
 * Astro integration for @codeatlasdev/ui.
 *
 *   // astro.config.mjs
 *   import svelte from "@astrojs/svelte";
 *   import { caUI } from "@codeatlasdev/ui/astro";
 *   export default defineConfig({ integrations: [svelte(), caUI(theme)] });
 *
 * - Paints the theme before first frame: brand preset CSS + init script go into an
 *   inline `<head>` script on every page (same output as caThemeHandle for SvelteKit).
 * - Keeps the theme across `<ClientRouter />` (View Transitions) navigations.
 * - Bundles the ESM-only/extensionless deps for SSR (tanstack table, shiki).
 *
 * Import `@codeatlasdev/ui/styles/global.css` once in your base layout.
 */
import type { AstroIntegration } from "astro";
import { defineTheme, fontPreloads, SSR_NO_EXTERNAL, themeCSS } from "./theme/define.js";
import { type ThemeOptions, themeScript } from "./theme-script.js";

/**
 * `<ClientRouter />` (View Transitions) replaces `<head>` and the `<html>` attributes with the next
 * document's, which only holds the head scripts, not what they created. Before each swap, copy the
 * live theme (style tags, theme-color meta, `<html>` theme attributes) onto the incoming document so
 * the swap keeps them. Registered once: head-inline scripts do not re-run on navigation.
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
['dark','ca-init'].forEach(function(k){r.classList.toggle(k,h.classList.contains(k))});
['data-preset','data-style','data-ca-scheme','data-ca-style','data-ca-live'].forEach(function(a){
  var v=h.getAttribute(a);
  if(v===null)r.removeAttribute(a);else r.setAttribute(a,v)})
})})();`;

/** Astro integration: injects the theme (preset CSS, fonts, init script) into every page `<head>` before first paint and bundles the ESM-only dependencies for SSR. Pass the same `ThemeOptions` as `defineTheme`. */
export function caUI(options: ThemeOptions = {}): AstroIntegration {
	const t = defineTheme(options);
	const css = themeCSS(t);
	// head-inline content is emitted verbatim inside <script>; the CSS rides along as a string.
	const style = css
		? `(function(){var s=document.createElement('style');s.id='ca-theme';s.textContent=${JSON.stringify(css).replace(/</g, "\\u003c")};document.head.appendChild(s)})();`
		: "";
	// A script cannot ship <link> tags verbatim: append them as markup. They start the font fetch
	// before CSS parsing ends, but the preload scanner never sees them. For the fastest path put the
	// same <link> in your layout head.
	const preloads = fontPreloads(t);
	const preload = preloads
		? `document.head.insertAdjacentHTML('afterbegin',${JSON.stringify(preloads).replace(/</g, "\\u003c")});`
		: "";
	return {
		name: "@codeatlasdev/ui",
		hooks: {
			"astro:config:setup": ({ injectScript, updateConfig }) => {
				injectScript("head-inline", preload + style + themeScript(t) + THEME_PERSIST_SCRIPT);
				updateConfig({ vite: { ssr: { noExternal: SSR_NO_EXTERNAL } } });
			},
		},
	};
}

export type { Paper, PresetDefinition, SchemeColors } from "./theme/define.js";
export type { DesignStyleId } from "./theme/styles.js";
// Recipes are plain data: safe to import from astro.config (no Svelte runes on this path).
export { DESIGN_STYLES, designStyle, mergeTheme } from "./theme/styles.js";
export type { ThemeOptions };

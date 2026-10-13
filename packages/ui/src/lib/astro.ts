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
 * - Bundles the ESM-only/extensionless deps for SSR (tanstack table, shiki).
 *
 * Import `@codeatlasdev/ui/styles/global.css` once in your base layout.
 */
import type { AstroIntegration } from "astro";
import { defineTheme, fontPreloads, SSR_NO_EXTERNAL, themeCSS } from "./theme/define.js";
import { type ThemeOptions, themeScript } from "./theme-script.js";

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
				injectScript("head-inline", preload + style + themeScript(t));
				updateConfig({ vite: { ssr: { noExternal: SSR_NO_EXTERNAL } } });
			},
		},
	};
}

export type { ThemeOptions };

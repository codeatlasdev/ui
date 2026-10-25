// ─── A design style, scoped to one element ─────────────────────────────────────────────────────────
// `themeCSS` writes a recipe on `:root` (and `[data-theme-scope]`). A style page needs the recipe on a
// subtree while the page around it keeps wearing the site's own theme, and a "before" subtree that
// wears the package default even though the site itself is a recipe (sketchbook).
//
// `designTokens` leaves a knob out when it equals the package default, so a recipe on its own would
// inherit whatever the page set. Every island therefore starts from `designDefaults()` and the recipe
// is layered on top: what you see is what an app with that `theme.ts` gets. Shadows and materials
// need no reset: the island carries `data-theme-scope` and `data-style`, so `tokens.css` and
// `materials.css` re-resolve them on the island itself. The one exception is the paper pattern, which
// this site overrides in `src/theme.ts` and the package default leaves empty.

// Relative imports of the package's pure theme modules (no Svelte): this file is also loaded by the
// unit tests, where the package root (which imports .svelte components) cannot be evaluated.
import {
	defineTheme,
	designDefaults,
	themeCSS,
} from "../../../packages/ui/src/lib/theme/define.ts";
import { type DesignStyleId, designStyle } from "../../../packages/ui/src/lib/theme/styles.ts";

/** Class that scopes the CSS of the "after" island. The "before" island uses `BEFORE`. */
export const AFTER = "sx-after";
export const BEFORE = "sx-before";

/**
 * Declarations of the package defaults on `selector`. The "before" island sits inside the page's own
 * recipe island, so it is scoped under the page island with an attribute (`.sx-after .sx-before[data-theme-scope]`, three
 * classes' worth of specificity beats the recipe's `.sx-after[data-theme-scope="dark"]`) and wins whatever the head order.
 */
const reset = (selector: string) =>
	`${selector}{${Object.entries({ ...designDefaults(), "--ca-page-mesh": "none" })
		.map(([k, v]) => `${k}:${v};`)
		.join("")}}`;

/**
 * Rewrite the `:root` / `[data-theme-scope]` selectors `themeCSS` emits to `.scope`, so the recipe
 * stays inside the island. Brand presets are keyed on `[data-preset]`, which works on any element.
 */
export function scopeCSS(css: string, scope: string): string {
	return css
		.replace(':root,\n[data-theme-scope="light"] {', `.${scope} {`)
		.replace(
			':root.dark,\n:root [data-theme-scope="dark"] {',
			`.${scope}[data-theme-scope="dark"] {`
		);
}

/**
 * `base.css` draws the glass mesh on `html[data-style="glass"]` through `body::before`, both outside an
 * island, so a glass island has nothing to blur. This is the same recipe (brand-tinted radial gradients,
 * stronger in dark), on the island itself: blur needs something colourful behind it to read.
 */
const MESH = {
	light: `radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in oklab, var(--ca-brand-main) 22%, transparent) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.68 0.14 235 / 0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 50%, oklch(0.60 0.13 150 / 0.12) 0%, transparent 50%)`,
	dark: `radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in oklab, var(--ca-brand-main) 42%, transparent) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.40 0.14 235 / 0.30) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 50%, oklch(0.35 0.10 150 / 0.20) 0%, transparent 50%)`,
};

/** The mesh a glass or frosted island paints behind its content; empty for every other material. */
export const meshCSS = (scope: string) =>
	`.${scope}[data-style="glass"]{--ca-page-mesh:${MESH.light};}\n.${scope}[data-style="glass"][data-theme-scope="dark"]{--ca-page-mesh:${MESH.dark};}`;

/** CSS for the "before" island: the package default, with nothing of the page's own theme left. */
export const beforeCSS = () => reset(`.${AFTER} .${BEFORE}[data-theme-scope]`);

/** CSS for the "after" island: the package default, then the recipe, scoped. */
export function afterCSS(id: DesignStyleId): string {
	return `${reset(`.${AFTER}`)}\n${scopeCSS(themeCSS(defineTheme(designStyle(id))), AFTER)}\n${meshCSS(AFTER)}`;
}

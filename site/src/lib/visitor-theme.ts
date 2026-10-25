// ─── "Apply to site": a design style worn by this browser only ────────────────────────────────────
// The recipe is compiled to CSS once and stored under the visitor-only key the Theme Studio uses
// (`ca-site-studio`). A tiny inline head script (`scripts/theme-boot.ts`) replays it before the
// first paint. Nothing here touches the published theme, the build output or the package defaults:
// remove the key and the site is exactly what ships. The visitor's own scheme and preset are never
// changed; only the surface material and the recipe's tokens are.
//
// The record is the same one the Studio writes (`v`, `css`, `preset`, `style`, `code`, `prev`), so
// "Reset" on either page clears what the other applied.

import {
	colorScheme,
	DESIGN_STYLES,
	type DesignStyleId,
	defineTheme,
	designStyle,
	type SurfaceStyle,
	themeCSS,
} from "@codeatlasdev/ui";

/** The visitor-only storage key. The boot script in `scripts/theme-boot.ts` reads the same one. */
export const SITE_KEY = "ca-site-studio";
export const STYLE_ID = "ca-site-studio";

/** What is persisted. `css` is the compiled theme, so the boot script needs no library code. */
export interface SiteTheme {
	v: 1;
	css: string;
	/** `data-preset` to show: a preset id the page already knows. */
	preset: string;
	/** `data-style` (surface material). */
	style: string;
	/** A string the writer understands to reopen what is applied. A style page writes `style:<id>`. */
	code: string;
	/** What the visitor had before applying, restored by `resetSite`. */
	prev: { preset: string; style: string };
}

/** Compile a recipe to the CSS the whole page wears: what an app that uses `designStyle(id)` ships. */
export function recipeCSS(id: DesignStyleId): string {
	return themeCSS(defineTheme(designStyle(id)));
}

export function readApplied(): SiteTheme | null {
	try {
		const v = JSON.parse(localStorage.getItem(SITE_KEY) ?? "null") as SiteTheme | null;
		return v && v.v === 1 && typeof v.css === "string" ? v : null;
	} catch {
		return null;
	}
}

/** The style id a style page applied, when the stored record came from one. */
export function appliedStyle(): DesignStyleId | null {
	const code = readApplied()?.code ?? "";
	const id = code.startsWith("style:") ? code.slice(6) : "";
	return id in DESIGN_STYLES ? (id as DesignStyleId) : null;
}

function writeStyle(css: string) {
	let el = document.getElementById(STYLE_ID);
	if (!css) return el?.remove();
	if (!el) {
		el = document.createElement("style");
		el.id = STYLE_ID;
	}
	el.textContent = css;
	// Last in the head: the site's own theme and component styles share these selectors.
	document.head.appendChild(el);
}

/** Make the whole site wear the recipe `id`, for this browser only. Returns the stored record. */
export function applyStyleToSite(id: DesignStyleId): SiteTheme {
	const css = recipeCSS(id);
	const style = (DESIGN_STYLES[id].theme.defaultStyle ?? "solid") as SurfaceStyle;
	const previous = readApplied();
	const applied: SiteTheme = {
		v: 1,
		css,
		preset: colorScheme.preset,
		style,
		code: `style:${id}`,
		prev: previous?.prev ?? { preset: colorScheme.preset, style: colorScheme.style },
	};
	try {
		localStorage.setItem(SITE_KEY, JSON.stringify(applied));
	} catch {
		/* private mode / quota: the theme still shows for this page */
	}
	writeStyle(css);
	colorScheme.setStyle(style);
	return applied;
}

/** Back to what the site ships: drops the stored theme and restores the visitor's own choices. */
export function resetSite(): void {
	const applied = readApplied();
	try {
		localStorage.removeItem(SITE_KEY);
	} catch {
		/* nothing stored */
	}
	writeStyle("");
	if (applied) {
		colorScheme.setStyle(applied.prev.style as SurfaceStyle);
		if (colorScheme.presets.includes(applied.prev.preset))
			colorScheme.setPreset(applied.prev.preset);
	}
}

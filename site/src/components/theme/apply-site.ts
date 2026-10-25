// ─── "Apply to site": the visitor's own theme, for this browser only ─────────
// The edited theme is compiled to CSS once, stored under the site's own key and replayed by a tiny
// inline head script (`scripts/theme-boot.ts`) before first paint. Nothing here touches the published theme,
// the build output or the package defaults: clear the key and the site is sketchbook again.

import { colorScheme } from "@codeatlasdev/ui";
import { siteCSS } from "./studio-output";
import { encodeState, type StudioState } from "./studio-state";

/** The site's own storage key. The boot script in `scripts/theme-boot.ts` reads the same one. */
export const SITE_KEY = "ca-site-studio";
export const STYLE_ID = "ca-site-studio";

/** What is persisted. `css` is the compiled theme, so the boot script needs no library code. */
export interface SiteTheme {
	v: 1;
	css: string;
	/** `data-preset` to show: a built-in id, or the site's own default preset id for a custom brand. */
	preset: string;
	/** `data-style` (surface material). */
	style: string;
	/** The studio state, as a share code, so the editor reopens on exactly what is applied. */
	code: string;
	/** What the visitor had before applying, restored by `reset`. */
	prev: { preset: string; style: string };
}

export function readApplied(): SiteTheme | null {
	try {
		const v = JSON.parse(localStorage.getItem(SITE_KEY) ?? "null") as SiteTheme | null;
		return v && v.v === 1 && typeof v.css === "string" ? v : null;
	} catch {
		return null;
	}
}

function writeStyle(css: string) {
	let el = document.getElementById(STYLE_ID);
	if (!css) return el?.remove();
	if (!el) {
		el = document.createElement("style");
		el.id = STYLE_ID;
	}
	el.textContent = css;
	// Always last in the head: the site's own theme and component styles share these selectors.
	document.head.appendChild(el);
}

/**
 * Make the whole site wear `state`. A custom brand is an extra preset the build never emitted, so
 * its id is the site's own default preset: the compiled CSS redefines `[data-preset="<id>"]` and the
 * existing theme store keeps working (scheme toggle, preset reads) with no special cases.
 */
export function applyToSite(state: StudioState, sitePreset: string): SiteTheme {
	const previous = readApplied();
	const custom = state.preset === "studio";
	// Rename the custom preset to the site's so `data-preset` is a value the page already knows.
	const css = siteCSS(state).replaceAll('[data-preset="studio"]', `[data-preset="${sitePreset}"]`);
	const preset = custom ? sitePreset : state.preset;
	const applied: SiteTheme = {
		v: 1,
		css,
		preset,
		style: state.surface,
		code: encodeState(state),
		prev: previous?.prev ?? { preset: colorScheme.preset, style: colorScheme.style },
	};
	try {
		localStorage.setItem(SITE_KEY, JSON.stringify(applied));
	} catch {
		/* private mode / quota: the theme still shows for this page */
	}
	writeStyle(css);
	colorScheme.setStyle(state.surface);
	colorScheme.setPreference(state.scheme);
	// A built-in preset must be one the page's init script knows; a custom one rides on `sitePreset`.
	if (colorScheme.presets.includes(preset)) colorScheme.setPreset(preset);
	return applied;
}

/** Back to what the site ships (sketchbook): drops the stored theme and restores the visitor's choices. */
export function resetSite(): void {
	const applied = readApplied();
	try {
		localStorage.removeItem(SITE_KEY);
	} catch {
		/* nothing stored */
	}
	writeStyle("");
	if (applied) {
		colorScheme.setStyle(applied.prev.style as typeof colorScheme.style);
		if (colorScheme.presets.includes(applied.prev.preset))
			colorScheme.setPreset(applied.prev.preset);
	}
}

// ─── App theme defaults for the server ───────────────────────────────────────
// On the client the store reads `<html>` and localStorage, which the init script has already set
// from the theme. The server has neither, so `caThemeHandle` / `caUI` register the theme here and
// `colorScheme` starts from it: markup bound to `colorScheme.preset` then ships the app's brand, not
// the library built-in. Module-level on purpose: a theme is an app constant, never per-request data.

import { BUILTIN_IDS, type ColorScheme, defineTheme, type SurfaceStyle } from "../theme/define.js";
import type { ThemeOptions } from "../theme-script.js";

export interface ThemeDefaults {
	preset: string;
	scheme: ColorScheme;
	style: SurfaceStyle;
	known: string[];
}

let defaults: ThemeDefaults = {
	preset: "amber",
	scheme: "dark",
	style: "solid",
	known: [...BUILTIN_IDS],
};

/** What `colorScheme` starts from when there is no DOM. */
export const themeDefaults = (): ThemeDefaults => defaults;

/** Registers the app's theme as the server-side starting point of `colorScheme`. */
export function setThemeDefaults(options: ThemeOptions): void {
	const t = defineTheme(options);
	defaults = {
		preset: t.defaultPreset,
		scheme: t.defaultScheme,
		style: t.defaultStyle,
		known: t.known,
	};
}

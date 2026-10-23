// ─── Map theme: tokens as RGBA, synced to the color scheme ───────────────────
import { colorScheme } from "../stores/color-scheme.svelte.js";
import { type Rgba, tokenColor } from "./color.js";

/** Semantic map colors as `[r, g, b, a]`, resolved from the live `--ca-*` tokens. */
export interface MapColors {
	brand: Rgba;
	brandMuted: Rgba;
	surface: Rgba;
	text: Rgba;
	textMuted: Rgba;
	outline: Rgba;
	success: Rgba;
	warning: Rgba;
	error: Rgba;
	info: Rgba;
}

/**
 * Reads the theme at call time. Reading `colorScheme` registers the dependency, so a `$derived` or
 * `$effect` that calls this re-runs on scheme, preset and surface-style changes.
 */
export function mapColors(): MapColors {
	void colorScheme.resolved;
	void colorScheme.preset;
	void colorScheme.style;
	return {
		brand: tokenColor("--ca-brand-main"),
		brandMuted: tokenColor("--ca-brand-main", 0.35),
		surface: tokenColor("--ca-surface-base"),
		text: tokenColor("--ca-text-primary"),
		textMuted: tokenColor("--ca-text-secondary"),
		outline: tokenColor("--ca-outline-subtle"),
		success: tokenColor("--ca-semantic-success"),
		warning: tokenColor("--ca-semantic-warning"),
		error: tokenColor("--ca-semantic-error"),
		info: tokenColor("--ca-semantic-info"),
	};
}

/** Which basemap style to show and the matching palette. `scheme` is `"light"` or `"dark"`. */
export interface MapTheme {
	readonly scheme: "light" | "dark";
	readonly colors: MapColors;
	/** Resolves any token to RGBA under the current theme; reactive like `colors`. */
	color: (token: string, alpha?: number) => Rgba;
}

/** Reactive map theme for a component: `theme.scheme`, `theme.colors`, `theme.color(token, alpha?)`. Call it during component init. */
export function useMapTheme(): MapTheme {
	return {
		get scheme() {
			return colorScheme.resolved;
		},
		get colors() {
			return mapColors();
		},
		color(token, alpha) {
			void colorScheme.resolved;
			void colorScheme.preset;
			return tokenColor(token, alpha);
		},
	};
}

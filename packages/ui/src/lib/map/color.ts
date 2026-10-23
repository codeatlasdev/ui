// ─── Token → RGBA for map consumers (deck.gl, MapLibre paint) ────────────────
// The resolver lives in `tokens/rgba.ts` (`tokenRgba`, also exported from `@codeatlasdev/ui/tokens`);
// the map entry keeps its original names.

import { type Rgba, tokenRgba } from "../tokens/rgba.js";

export type { Rgba };

/**
 * A design token (`--ca-brand-main`) or any CSS color (`#f59e0b`, `oklch(...)`, `color-mix(...)`) as
 * `[r, g, b, a]` for deck.gl and map paint properties. `alpha` (0-1) multiplies the color's own
 * alpha. An unset token is transparent black. Server-side it returns transparent black too.
 */
export function tokenColor(token: string, alpha = 1): Rgba {
	return tokenRgba(token, alpha);
}

/** `[r, g, b, a]` as a CSS `rgba()` string, for MapLibre/Mapbox paint properties. */
export function rgbaCss([r, g, b, a]: Rgba): string {
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── Shadow tokens ─────────────────────────────────────────────────────────────
// 5-tier system mapped to Apple HIG material thickness levels.
// Shadow hue: warm stone 70° — avoids cold blue-gray.

const warm = (blur: number, spread: number, opacity: number): string =>
	`0 ${blur}px ${spread}px oklch(0.25 0.008 70 / ${opacity})`;

/** Box-shadow strings per material thickness (`none` to `chrome`), tinted with warm stone. */
export const shadows = {
	none: "none",
	ultraThin: warm(2, 4, 0.07),
	thin: warm(3, 8, 0.09),
	regular: "0 4px 16px oklch(0.25 0.008 70 / 0.12)",
	thick: "0 6px 24px oklch(0.25 0.008 70 / 0.14)",
	chrome: "0 12px 40px oklch(0.25 0.008 70 / 0.19)",
} as const;

/** Elevation depth in px per material thickness (`flat` 0 to `chrome` 20). */
export const elevation = {
	flat: 0,
	ultraThin: 2,
	thin: 4,
	regular: 8,
	thick: 12,
	chrome: 20,
} as const;

export type ElevationLevel = keyof typeof elevation;
export type ShadowLevel = keyof typeof shadows;

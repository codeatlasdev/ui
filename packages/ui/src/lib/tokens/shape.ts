// ─── Shape / border-radius tokens ─────────────────────────────────────────────
// Scale: 4 / 6 / 10 / 14 / 20 / 999
// Base steps (before --ca-radius-scale, default 0.8: md renders 8px).

/** Border-radius scale in px (xs 4, sm 6, md 10, lg 14, xl 20, pill 999). Mirrors `--ca-radius-*`. */
export const radius = {
	xs: 4,
	sm: 6,
	md: 10, // base/default
	lg: 14,
	xl: 20,
	pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;

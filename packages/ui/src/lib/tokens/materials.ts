// ─── Material / Liquid Glass tokens ────────────────────────────────────────
// Framework-agnostic. These are the JS source-of-truth for all --ca-glass-*
// CSS custom properties injected by global.css.

export type Thickness = "ultra-thin" | "thin" | "regular" | "thick" | "chrome";

// SVG optical parameters for LiquidGlass.svelte refraction layer
/** Optical parameters (frost, bend, depth, curvature, sheen, dispersion) of the SVG refraction layer per material thickness; used by `LiquidGlass`. */
export const GLASS_OPTICS: Record<
	Thickness,
	{
		frost: number;
		bend: number;
		depth: number;
		curvature: number;
		sheen: number;
		dispersion: number;
	}
> = {
	"ultra-thin": { frost: 6, bend: 0.2, depth: 0.6, curvature: 0.1, sheen: 0.4, dispersion: 0.05 },
	thin: { frost: 10, bend: 0.3, depth: 0.7, curvature: 0.15, sheen: 0.5, dispersion: 0.08 },
	regular: { frost: 18, bend: 0.35, depth: 0.75, curvature: 0.2, sheen: 0.55, dispersion: 0.1 },
	thick: { frost: 28, bend: 0.4, depth: 0.8, curvature: 0.25, sheen: 0.6, dispersion: 0.12 },
	chrome: { frost: 38, bend: 0.45, depth: 0.85, curvature: 0.3, sheen: 0.65, dispersion: 0.14 },
} as const;

// Vibrancy hierarchy — mirrors Apple UIVibrancyEffect label tiers
export type VibrancyLevel = "label" | "secondary" | "tertiary" | "fill" | "separator";

// CSS var names per thickness tier — for programmatic use in components
/** `--ca-glass-*` tint variable name per material thickness. */
export const MATERIAL_CSS_VARS: Record<Thickness, string> = {
	"ultra-thin": "var(--ca-glass-tint-ultra-thin)",
	thin: "var(--ca-glass-tint-thin)",
	regular: "var(--ca-glass-tint)",
	thick: "var(--ca-glass-tint-thick)",
	chrome: "var(--ca-glass-tint-chrome)",
} as const;

/** `--ca-glass-blur-*` variable name per material thickness. */
export const MATERIAL_BLUR_VARS: Record<Thickness, string> = {
	"ultra-thin": "var(--ca-blur-ultra-thin)",
	thin: "var(--ca-blur-thin)",
	regular: "var(--ca-blur-regular)",
	thick: "var(--ca-blur-thick)",
	chrome: "var(--ca-blur-chrome)",
} as const;

// Light-mode glass token values
/** Light-mode `--ca-glass-*` token values, as the CSS emits them. */
export const lightMaterialTokens = {
	"--ca-glass-tint-ultra-thin": "oklch(0.97 0.003 55 / 0.15)",
	"--ca-glass-tint-thin": "oklch(0.97 0.003 55 / 0.22)",
	"--ca-glass-tint": "oklch(0.97 0.003 55 / 0.32)",
	"--ca-glass-tint-thick": "oklch(0.975 0.003 55 / 0.52)",
	"--ca-glass-tint-chrome": "oklch(0.980 0.002 55 / 0.72)",
	"--ca-glass-tint-solid": "oklch(0.96 0.004 55)",
	"--ca-glass-rim": "oklch(1 0 0 / 0.70)",
	"--ca-glass-rim-opacity": "0.70",
	"--ca-glass-shadow":
		"0 4px 24px oklch(0.20 0.012 55 / 0.12), 0 1px 4px oklch(0.20 0.012 55 / 0.08)",
	"--ca-glass-border": "oklch(0.70 0.008 55 / 0.28)",
	"--ca-glow-primary": "oklch(0.54 0.21 55 / 0.12)",
	"--ca-glow-primary-strong": "oklch(0.54 0.21 55 / 0.22)",
	"--ca-vibrancy-label": "oklch(0.18 0.010 55 / 0.85)",
	"--ca-vibrancy-secondary": "oklch(0.18 0.010 55 / 0.50)",
	"--ca-vibrancy-tertiary": "oklch(0.18 0.010 55 / 0.25)",
	"--ca-vibrancy-fill": "oklch(0.18 0.010 55 / 0.10)",
	"--ca-vibrancy-separator": "oklch(0.18 0.010 55 / 0.05)",
	"--ca-blur-ultra-thin": "blur(8px) saturate(160%)",
	"--ca-blur-thin": "blur(14px) saturate(175%)",
	"--ca-blur-regular": "blur(22px) saturate(190%)",
	"--ca-blur-thick": "blur(32px) saturate(200%)",
	"--ca-blur-chrome": "blur(44px) saturate(210%)",
	"--ca-glass-frost": "18",
	"--ca-tooltip-fg": "oklch(0.97 0.003 55)",
	"--ca-glass-highlight": "oklch(1 0 0 / 0.60)",
	"--ca-scrim-color": "oklch(0.12 0.010 55 / 0.38)",
	"--ca-scrim-blur": "blur(4px) saturate(180%)",
} as const;

// Dark-mode glass token values
/** Dark-mode `--ca-glass-*` token values, as the CSS emits them. */
export const darkMaterialTokens = {
	"--ca-glass-tint-ultra-thin": "oklch(0.20 0 0 / 0.28)",
	"--ca-glass-tint-thin": "oklch(0.22 0 0 / 0.42)",
	"--ca-glass-tint": "oklch(0.24 0 0 / 0.52)",
	"--ca-glass-tint-thick": "oklch(0.20 0 0 / 0.72)",
	"--ca-glass-tint-chrome": "oklch(0.16 0 0 / 0.88)",
	"--ca-glass-tint-solid": "oklch(0.18 0 0)",
	"--ca-glass-rim": "oklch(1 0 0 / 0.16)",
	"--ca-glass-rim-opacity": "0.16",
	"--ca-glass-shadow": "0 8px 40px oklch(0 0 0 / 0.50)",
	"--ca-glass-border": "oklch(1 0 0 / 0.14)",
	"--ca-glow-primary": "oklch(0.63 0.20 55 / 0.16)",
	"--ca-glow-primary-strong": "oklch(0.63 0.20 55 / 0.32)",
	"--ca-vibrancy-label": "oklch(0.93 0.005 55 / 0.85)",
	"--ca-vibrancy-secondary": "oklch(0.93 0.005 55 / 0.50)",
	"--ca-vibrancy-tertiary": "oklch(0.93 0.005 55 / 0.25)",
	"--ca-vibrancy-fill": "oklch(0.93 0.005 55 / 0.10)",
	"--ca-vibrancy-separator": "oklch(0.93 0.005 55 / 0.05)",
	"--ca-blur-ultra-thin": "blur(8px) saturate(150%) brightness(1.02)",
	"--ca-blur-thin": "blur(14px) saturate(165%) brightness(1.02)",
	"--ca-blur-regular": "blur(22px) saturate(180%) brightness(1.02)",
	"--ca-blur-thick": "blur(32px) saturate(200%) brightness(1.01)",
	"--ca-blur-chrome": "blur(44px) saturate(210%) brightness(1.01)",
	"--ca-glass-frost": "18",
	"--ca-tooltip-fg": "oklch(0.93 0.005 55)",
	"--ca-glass-highlight": "oklch(1 0 0 / 0.06)",
	"--ca-scrim-color": "oklch(0 0 0 / 0.50)",
	"--ca-scrim-blur": "blur(4px) saturate(180%)",
} as const;

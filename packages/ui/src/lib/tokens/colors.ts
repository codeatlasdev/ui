// ─── CodeAtlas color tokens (OKLCH, framework-agnostic) ──────────────────────
// No MUI types — pure design data. Components consume these via CSS vars;
// the JS objects are exposed for tooling, docs, and preset-picker UIs.

// ── Brand identity (default: CodeAtlas amber, H 31°) ─────────────────────────
/** Default brand ramp (CodeAtlas amber) in OKLCH: `main`, `light`, `dark`, `contrast`. */
export const defaultBrand = {
	main: "oklch(0.64 0.247 31.4)",
	light: "oklch(0.72 0.200 31.4)",
	dark: "oklch(0.52 0.230 31.4)",
	contrast: "oklch(1 0 0)",
} as const;

// ── Shared semantic palette (same across all presets / modes) ─────────────────
// Canvas-measured WCAG AA/AAA values — see presets.ts comments for rationale.
/** Semantic status colors (secondary, success, warning, info, error) for light mode, in OKLCH. */
export const semanticLight = {
	secondary: "oklch(0.910 0.005 75)",
	success: "oklch(0.46 0.145 150)",
	warning: "oklch(0.53 0.130 75)",
	info: "oklch(0.50 0.125 235)",
	error: "oklch(0.55 0.190 25)",
} as const;

/** Semantic status colors (secondary, success, warning, info, error) for dark mode, in OKLCH. */
export const semanticDark = {
	secondary: "oklch(0.250 0.005 70)",
	success: "oklch(0.71 0.160 150)",
	warning: "oklch(0.84 0.140 88)",
	info: "oklch(0.72 0.140 235)",
	error: "oklch(0.76 0.185 16)",
} as const;

// ── Neutral ramp factory ──────────────────────────────────────────────────────
// Generates surface/text/outline sets for a given brand hue.
// All presets share identical L and C — only H shifts.
export interface SurfaceColors {
	sunken: string;
	base: string;
	raised: string;
	overlay: string;
}

export interface TextColors {
	primary: string;
	secondary: string;
	disabled: string;
}

export interface OutlineColors {
	subtle: string;
	default: string;
	strong: string;
}

export interface BrandColors {
	main: string;
	light: string;
	dark: string;
	contrast: string;
}

export interface SemanticColors {
	secondary: string;
	success: string;
	warning: string;
	info: string;
	error: string;
}

export interface NeutralRamp {
	surfaceLight: SurfaceColors;
	surfaceDark: SurfaceColors;
	textLight: TextColors;
	textDark: TextColors;
	outlineLight: OutlineColors;
	outlineDark: OutlineColors;
}

/** Neutral surface/text/outline ramp tinted with the given brand hue (OKLCH degrees). */
export function neutralRamp(hue: number): NeutralRamp {
	const dh = hue + 5;
	return {
		surfaceLight: {
			sunken: `oklch(0.930 0.006 ${hue})`,
			base: `oklch(0.955 0.005 ${hue})`,
			raised: `oklch(0.980 0.003 ${hue})`,
			overlay: `oklch(0.995 0.001 ${hue})`,
		},
		surfaceDark: {
			sunken: `oklch(0.115 0.006 ${hue})`,
			base: `oklch(0.150 0.006 ${hue})`,
			raised: `oklch(0.190 0.006 ${hue})`,
			overlay: `oklch(0.235 0.006 ${hue})`,
		},
		textLight: {
			primary: `oklch(0.200 0.012 ${hue})`,
			secondary: `oklch(0.420 0.010 ${hue})`,
			disabled: `oklch(0.620 0.008 ${hue})`,
		},
		textDark: {
			primary: `oklch(0.940 0.005 ${dh})`,
			secondary: `oklch(0.730 0.007 ${dh})`,
			disabled: `oklch(0.500 0.007 ${dh})`,
		},
		outlineLight: {
			subtle: `oklch(0.200 0.010 ${hue} / 0.08)`,
			default: `oklch(0.200 0.010 ${hue} / 0.16)`,
			strong: `oklch(0.200 0.010 ${hue} / 0.30)`,
		},
		outlineDark: {
			subtle: "oklch(1 0 0 / 0.08)",
			default: "oklch(1 0 0 / 0.14)",
			strong: "oklch(1 0 0 / 0.26)",
		},
	};
}

// ── Action tokens (light / dark) ──────────────────────────────────────────────
/** Interaction overlays for light mode (`active`, `hover`, `selected`, `disabled`, `disabledBg`, `focus`), in OKLCH. */
export const actionLight = {
	active: "oklch(0.2 0 0 / 0.62)",
	hover: "oklch(0.2 0 0 / 0.055)",
	selected: "oklch(0.2 0 0 / 0.09)",
	disabled: "oklch(0.2 0 0 / 0.30)",
	disabledBg: "oklch(0.2 0 0 / 0.08)",
	focus: "oklch(0.2 0 0 / 0.12)",
} as const;

/** Interaction overlays for dark mode (`active`, `hover`, `selected`, `disabled`, `disabledBg`, `focus`), in OKLCH. */
export const actionDark = {
	active: "oklch(1 0 0 / 0.68)",
	hover: "oklch(1 0 0 / 0.075)",
	selected: "oklch(1 0 0 / 0.13)",
	disabled: "oklch(1 0 0 / 0.30)",
	disabledBg: "oklch(1 0 0 / 0.10)",
	focus: "oklch(1 0 0 / 0.14)",
} as const;

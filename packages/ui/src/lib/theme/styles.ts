// ─── Design styles: token recipes for well-known visual languages ─────────────
// Each recipe is a partial theme built only from the orthogonal design knobs (material,
// radius, border, elevation, typography, density, motion, icon stroke, texture). Start from
// one with `designStyle("brutalism", { presets: [...] })` and override anything.
// Taxonomy ids refer to the Atlas of interface aesthetics (DS001…DS269). Values are design
// proposals, not measurements; contrast-sensitive styles keep text tokens AA by default.

import type { ThemeDefinition } from "./define.js";

export type DesignStyleId =
	| "default"
	| "swiss"
	| "brutalism"
	| "neumorphism"
	| "glassmorphism"
	| "material"
	| "fluent"
	| "apple"
	| "bento"
	| "claymorphism"
	| "y2k"
	| "editorial"
	| "terminal"
	| "sketchbook";

export interface DesignStyle {
	id: DesignStyleId;
	label: string;
	/** One line: what it looks like and when it fits. */
	description: string;
	/** Atlas taxonomy ids this recipe implements. */
	taxonomy: string[];
	theme: Partial<ThemeDefinition>;
}

const SYSTEM_SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SWISS_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", serif';
const MONO = 'ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';
const ROUNDED = 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif';

/** Design-style recipes by id (glass, solid, flat, ... editorial, terminal): each is a `Partial<ThemeDefinition>` to pass to `defineTheme` or `mergeTheme`. */
export const DESIGN_STYLES: Record<DesignStyleId, DesignStyle> = {
	default: {
		id: "default",
		label: "CodeAtlas",
		description: "Liquid glass surfaces, soft elevation, Inter. The package default.",
		taxonomy: ["DS062", "DS063"],
		theme: {},
	},
	swiss: {
		id: "swiss",
		label: "Swiss",
		description: "Grid, hairlines, square corners, no shadows. Order and legibility first.",
		taxonomy: ["DS001", "DS002"],
		theme: {
			defaultStyle: "outlined",
			radius: 0,
			elevation: "none",
			border: { width: 1, strong: 2 },
			fonts: { body: SWISS_SANS, display: SWISS_SANS },
			typography: {
				weights: { heading: 700, semibold: 600 },
				headingTracking: "-0.01em",
				labelCase: "uppercase",
				labelTracking: "0.06em",
			},
			motion: { scale: 0.7, easing: "standard" },
			iconStroke: 1.5,
		},
	},
	brutalism: {
		id: "brutalism",
		label: "Neobrutalism",
		description: "Thick black strokes, hard offset shadows, flat saturated fills, loud type.",
		taxonomy: ["DS015", "DS016"],
		theme: {
			defaultStyle: "outlined",
			radius: 0,
			elevation: "hard",
			border: { width: 3, strong: 4 },
			fonts: { body: SYSTEM_SANS, display: SYSTEM_SANS },
			typography: {
				weights: { heading: 900, bold: 800, semibold: 700, medium: 600 },
				headingTracking: "-0.01em",
				headingCase: "uppercase",
				labelCase: "uppercase",
				labelTracking: "0.04em",
			},
			motion: { scale: 0.5, easing: "steps" },
			iconStroke: 2.5,
		},
	},
	neumorphism: {
		id: "neumorphism",
		label: "Neumorphism",
		description: "Monochrome base extruded by paired shadows. Showcase surfaces, not dense data.",
		taxonomy: ["DS057"],
		theme: {
			defaultStyle: "neumorphic",
			radius: 1.6,
			controlRadius: "lg",
			elevation: "soft",
			border: { width: 0 },
			typography: { weights: { heading: 600 } },
			motion: { scale: 1, easing: "standard" },
			iconStroke: 1.75,
		},
	},
	glassmorphism: {
		id: "glassmorphism",
		label: "Glassmorphism",
		description: "Translucent blurred layers over a colorful backdrop, thin rims, soft shadows.",
		taxonomy: ["DS062"],
		theme: {
			defaultStyle: "glass",
			radius: 1.4,
			controlRadius: "lg",
			elevation: "soft",
			noise: 0.03,
			overrides: {
				light: {
					"--ca-blur-thin": "blur(18px) saturate(180%)",
					"--ca-blur-regular": "blur(28px) saturate(190%)",
					"--ca-blur-thick": "blur(36px) saturate(200%)",
					"--ca-glass-rim": "oklch(1 0 0 / 0.9)",
				},
				dark: {
					"--ca-blur-thin": "blur(18px) saturate(180%)",
					"--ca-blur-regular": "blur(28px) saturate(190%)",
					"--ca-blur-thick": "blur(36px) saturate(200%)",
					"--ca-glass-rim": "oklch(1 0 0 / 0.32)",
				},
			},
			motion: { scale: 1, easing: "emphasized" },
			iconStroke: 1.75,
		},
	},
	material: {
		id: "material",
		label: "Material 3",
		description: "Tonal surfaces tinted by the brand, pill controls, emphasized easing.",
		taxonomy: ["DS197"],
		theme: {
			defaultStyle: "tonal",
			radius: 1.2,
			controlRadius: "pill",
			elevation: "soft",
			fonts: { body: 'Roboto, "Roboto Flex", system-ui, sans-serif' },
			typography: { weights: { heading: 500, semibold: 500 }, headingTracking: "0em" },
			motion: { scale: 1.6, easing: "emphasized" },
			iconStroke: 2,
		},
	},
	fluent: {
		id: "fluent",
		label: "Fluent 2",
		description: "Acrylic (frosted blur plus grain), small radii, subtle depth, compact and fast.",
		taxonomy: ["DS198"],
		theme: {
			defaultStyle: "frosted",
			noise: 0.035,
			radius: 0.6,
			controlRadius: "sm",
			density: "compact",
			elevation: "soft",
			fonts: { body: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif' },
			typography: { weights: { heading: 600 }, headingTracking: "0em" },
			motion: { scale: 0.85, easing: "standard" },
			iconStroke: 1.5,
		},
	},
	apple: {
		id: "apple",
		label: "Apple HIG",
		description: "System type with tight headings, rounded continuous corners, glass on controls.",
		taxonomy: ["DS199", "DS063"],
		theme: {
			defaultStyle: "frosted",
			radius: 1.3,
			controlRadius: "lg",
			fonts: { body: SYSTEM_SANS, display: SYSTEM_SANS },
			typography: { weights: { heading: 700, semibold: 590 }, headingTracking: "-0.025em" },
			motion: { scale: 1.3, easing: "spring" },
			iconStroke: 1.75,
		},
	},
	bento: {
		id: "bento",
		label: "Bento",
		description:
			"Modular cards with generous radius and gaps; pair with Grid for the modular layout.",
		taxonomy: ["DS120"],
		theme: {
			defaultStyle: "solid",
			radius: 1.6,
			controlRadius: "lg",
			density: "airy",
			typography: { weights: { heading: 650 }, headingTracking: "-0.025em" },
			motion: { scale: 1, easing: "emphasized" },
		},
	},
	claymorphism: {
		id: "claymorphism",
		label: "Claymorphism",
		description: "Inflated pastel surfaces, inner highlights, rounded type, bouncy motion.",
		taxonomy: ["DS067"],
		theme: {
			defaultStyle: "clay",
			radius: 2,
			controlRadius: "pill",
			fonts: { body: ROUNDED, display: ROUNDED },
			typography: { weights: { heading: 800, semibold: 700 } },
			motion: { scale: 1.4, easing: "spring" },
			iconStroke: 2.25,
		},
	},
	y2k: {
		id: "y2k",
		label: "Y2K",
		description: "Glossy chrome, pill shapes, glow, wide-tracked bubbly type.",
		taxonomy: ["DS024", "DS028"],
		theme: {
			defaultStyle: "chrome",
			radius: 2,
			controlRadius: "pill",
			elevation: "glow",
			fonts: { body: ROUNDED, display: ROUNDED },
			typography: { weights: { heading: 800 }, headingTracking: "0.02em", labelTracking: "0.06em" },
			motion: { scale: 1.2, easing: "spring" },
			noise: 0.04,
			iconStroke: 2,
		},
	},
	editorial: {
		id: "editorial",
		label: "Editorial",
		description: "Serif display, generous measure and whitespace, hairline dividers, no shadows.",
		taxonomy: ["DS042", "DS043", "DS124"],
		theme: {
			defaultStyle: "flat",
			radius: 0.2,
			elevation: "none",
			density: "airy",
			fonts: { display: SERIF },
			typography: {
				scale: 1.06,
				weights: { heading: 500 },
				headingTracking: "-0.015em",
				lineHeight: 1.7,
				measure: "65ch",
				labelCase: "uppercase",
				labelTracking: "0.12em",
			},
			motion: { scale: 1.3, easing: "standard" },
			iconStroke: 1.25,
		},
	},
	terminal: {
		id: "terminal",
		label: "Terminal",
		description: "Monospace everything, square cells, phosphor strokes, instant motion.",
		taxonomy: ["DS102"],
		theme: {
			defaultStyle: "outlined",
			defaultScheme: "dark",
			radius: 0,
			elevation: "none",
			density: "compact",
			fonts: { body: MONO, display: MONO, mono: MONO },
			typography: {
				scale: 0.95,
				weights: { heading: 700, semibold: 600 },
				headingTracking: "0em",
				labelCase: "uppercase",
			},
			motion: { scale: 0, easing: "steps" },
			iconStroke: 1.5,
		},
	},
	sketchbook: {
		id: "sketchbook",
		label: "Sketchbook",
		description:
			"Journal on grid paper: serif display, square outlined cards with hard shadows, hand-drawn marks (.ca-mark-*).",
		taxonomy: ["DS015", "DS042"],
		theme: {
			defaultStyle: "outlined",
			radius: 0,
			elevation: "hard",
			border: { width: 2, strong: 3 },
			fonts: { display: SERIF },
			typography: {
				weights: { heading: 600, semibold: 600 },
				headingTracking: "-0.015em",
				labelCase: "uppercase",
				labelTracking: "0.08em",
				lineHeight: 1.65,
			},
			motion: { scale: 0.6, easing: "standard" },
			paper: "grid",
		},
	},
};

/** Merge partial themes: `b` wins; the nested option groups merge key by key. */
export function mergeTheme(
	a: Partial<ThemeDefinition>,
	b: Partial<ThemeDefinition>
): Partial<ThemeDefinition> {
	return {
		...a,
		...b,
		fonts: { ...a.fonts, ...b.fonts },
		border: { ...a.border, ...b.border },
		motion: { ...a.motion, ...b.motion },
		typography: {
			...a.typography,
			...b.typography,
			weights: { ...a.typography?.weights, ...b.typography?.weights },
		},
		overrides: {
			light: { ...a.overrides?.light, ...b.overrides?.light },
			dark: { ...a.overrides?.dark, ...b.overrides?.dark },
		},
	};
}

/**
 * A design style recipe with your overrides on top, ready for `defineTheme`/`caThemeHandle`.
 *
 *   export const theme = designStyle("brutalism", { presets: [{ id: "acme", color: "#ff5c00" }], defaultPreset: "acme" });
 */
export function designStyle(
	id: DesignStyleId,
	overrides: Partial<ThemeDefinition> = {}
): Partial<ThemeDefinition> {
	return mergeTheme(DESIGN_STYLES[id].theme, overrides);
}

// Source of the 8 built-in presets. scripts/build-themes.ts renders styles/presets/*.css from it.
// `overrides` pins tokens the generator does not reproduce within OKLab dE < 0.02.
import type { TokenMap } from "../utils/palette-generator.js";

export interface BuiltinPresetSource {
	id: "amber" | "ocean" | "crimson" | "cyan" | "violet" | "emerald" | "rose" | "slate";
	label: string;
	/** sRGB swatch for pickers and canvas. */
	color: `#${string}`;
	hue: number;
	chroma: number;
	lightL: number;
	overrides: { light: TokenMap; dark: TokenMap };
}

export const BUILTIN_PRESETS: BuiltinPresetSource[] = [
	{
		id: "amber",
		label: "Amber",
		color: "#c47a15",
		hue: 55,
		chroma: 0.21,
		lightL: 0.54,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.63 0.21 55)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 55 / 0.12), 0 1px 4px oklch(0.20 0.012 55 / 0.08)",
			},
			dark: {},
		},
	},
	{
		id: "ocean",
		label: "Ocean",
		color: "#2b5fd9",
		hue: 260,
		chroma: 0.22,
		lightL: 0.5,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.59 0.22 260)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 260 / 0.12), 0 1px 4px oklch(0.20 0.012 260 / 0.08)",
			},
			dark: {
				"--ca-brand-main": "oklch(0.63 0.22 260)",
				"--ca-brand-light": "oklch(0.72 0.22 260)",
				"--ca-brand-dark": "oklch(0.52 0.22 260)",
				"--ca-glow-primary": "oklch(0.63 0.22 260 / 0.16)",
				"--ca-glow-primary-strong": "oklch(0.63 0.22 260 / 0.32)",
			},
		},
	},
	{
		id: "crimson",
		label: "Crimson",
		color: "#c00020",
		hue: 26,
		chroma: 0.23,
		lightL: 0.44,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.53 0.23 26)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 26 / 0.12), 0 1px 4px oklch(0.20 0.012 26 / 0.08)",
			},
			dark: {
				"--ca-brand-main": "oklch(0.63 0.21 26)",
				"--ca-brand-light": "oklch(0.72 0.21 26)",
				"--ca-brand-dark": "oklch(0.52 0.21 26)",
				"--ca-brand-fill": "oklch(0.59 0.21 26)",
				"--ca-brand-fill-hover": "oklch(0.53 0.204 26)",
				"--ca-glow-primary": "oklch(0.63 0.21 26 / 0.16)",
				"--ca-glow-primary-strong": "oklch(0.63 0.21 26 / 0.32)",
			},
		},
	},
	{
		id: "cyan",
		label: "Cyan",
		color: "#0094a8",
		hue: 193,
		chroma: 0.22,
		lightL: 0.48,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.57 0.22 193)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 193 / 0.12), 0 1px 4px oklch(0.20 0.012 193 / 0.08)",
			},
			dark: {
				"--ca-brand-light": "oklch(0.66 0.22 193)",
			},
		},
	},
	{
		id: "violet",
		label: "Violet",
		color: "#8b3ec8",
		hue: 295,
		chroma: 0.24,
		lightL: 0.47,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.56 0.24 295)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 295 / 0.12), 0 1px 4px oklch(0.20 0.012 295 / 0.08)",
			},
			dark: {
				"--ca-brand-light": "oklch(0.65 0.24 295)",
			},
		},
	},
	{
		id: "emerald",
		label: "Emerald",
		color: "#1a7a50",
		hue: 152,
		chroma: 0.2,
		lightL: 0.46,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.55 0.20 152)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 152 / 0.12), 0 1px 4px oklch(0.20 0.012 152 / 0.08)",
			},
			dark: {
				"--ca-brand-light": "oklch(0.64 0.20 152)",
			},
		},
	},
	{
		id: "rose",
		label: "Rose",
		color: "#c8405a",
		hue: 350,
		chroma: 0.22,
		lightL: 0.5,
		overrides: {
			light: {
				"--ca-brand-light": "oklch(0.59 0.22 350)",
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 350 / 0.12), 0 1px 4px oklch(0.20 0.012 350 / 0.08)",
			},
			dark: {
				"--ca-brand-light": "oklch(0.68 0.22 350)",
			},
		},
	},
	{
		id: "slate",
		label: "Slate",
		color: "#3c5a8a",
		hue: 220,
		chroma: 0.1,
		lightL: 0.48,
		overrides: {
			light: {
				"--ca-glass-shadow":
					"0 4px 24px oklch(0.20 0.012 220 / 0.12), 0 1px 4px oklch(0.20 0.012 220 / 0.08)",
			},
			dark: {},
		},
	},
];

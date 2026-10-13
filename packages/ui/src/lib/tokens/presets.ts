// ─── Preset data (framework-agnostic) ────────────────────────────────────────
// Metadata for pickers and charts, derived from theme/builtins.ts (the same
// source scripts/build-themes.ts renders into styles/presets/*.css).

import { BUILTIN_PRESETS } from "../theme/builtins.js";
import { generatePreset } from "../utils/palette-generator.js";
import type { BrandColors, NeutralRamp, SemanticColors } from "./colors.js";
import { neutralRamp } from "./colors.js";

/** Presets shipped in global.css. */
export type BuiltinPresetId =
	| "amber"
	| "ocean"
	| "crimson"
	| "cyan"
	| "violet"
	| "emerald"
	| "rose"
	| "slate";

/** A built-in preset or a brand preset registered via `ThemeOptions.presets`. */
export type PresetId = BuiltinPresetId | (string & {});

export interface ThemePreset {
	id: BuiltinPresetId;
	label: string;
	swatchColor: string;
	hue: number;
	brandLight: BrandColors;
	brandDark: BrandColors;
	ramp: NeutralRamp;
	semanticLight: SemanticColors;
	semanticDark: SemanticColors;
}

// Shared semantic colors (same for all presets)
// warning H=88 separates from amber brand (H=55)
const semanticLight: SemanticColors = {
	secondary: "oklch(0.910 0.005 88)",
	success: "oklch(0.46 0.145 150)",
	warning: "oklch(0.53 0.130 88)",
	info: "oklch(0.50 0.125 235)",
	error: "oklch(0.55 0.190 25)",
};
const semanticDark: SemanticColors = {
	secondary: "oklch(0.250 0.005 88)",
	success: "oklch(0.71 0.160 150)",
	warning: "oklch(0.84 0.140 88)",
	info: "oklch(0.72 0.140 235)",
	error: "oklch(0.76 0.185 16)",
};

/** Map generatePreset tokens → ThemePreset brand slots */
function makeBrand(
	hue: number,
	chroma: number,
	lightL: number
): Pick<ThemePreset, "brandLight" | "brandDark"> {
	const t = generatePreset(hue, chroma, lightL);
	return {
		brandLight: {
			main: t.brandMain,
			light: t.brandLight,
			dark: t.brandDark,
			contrast: t.brandContrast,
		},
		brandDark: {
			main: t.dark.brandMain,
			light: t.dark.brandLight,
			dark: t.dark.brandDark,
			contrast: t.dark.brandContrast,
		},
	};
}

export const THEME_PRESETS: ThemePreset[] = BUILTIN_PRESETS.map((p) => ({
	id: p.id,
	label: p.label,
	swatchColor: p.color,
	hue: p.hue,
	...makeBrand(p.hue, p.chroma, p.lightL),
	ramp: neutralRamp(p.hue),
	semanticLight,
	semanticDark,
}));

export function getPreset(id: PresetId): ThemePreset {
	return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

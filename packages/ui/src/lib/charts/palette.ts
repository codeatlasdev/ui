// ─── Canvas-safe series palette ───────────────────────────────────────────────
// ECharts canvas APIs (gradients, visualMap stops) reject oklch — hex/rgba only.
// One 8-color ramp per preset, brand color always first.

import type { BuiltinPresetId } from "../tokens/presets.js";
import { trackTheme } from "./tokens.js";

const PRESET_PALETTES: Record<BuiltinPresetId, string[]> = {
	amber: ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"],
	ocean: ["#0ea5e9", "#f59e0b", "#22c55e", "#ef4444", "#a78bfa", "#e879f9", "#f97316", "#84cc16"],
	crimson: ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"],
	cyan: ["#06b6d4", "#f59e0b", "#22c55e", "#ef4444", "#a78bfa", "#3b82f6", "#f97316", "#84cc16"],
	violet: ["#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#3b82f6", "#06b6d4", "#f97316", "#84cc16"],
	emerald: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"],
	rose: ["#f43f5e", "#3b82f6", "#22c55e", "#f59e0b", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"],
	slate: ["#64748b", "#f59e0b", "#22c55e", "#ef4444", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"],
};

/** Secondary series for brand presets: the built-in ramp minus a brand slot. */
const BRAND_REST = ["#f59e0b", "#22c55e", "#ef4444", "#a78bfa", "#06b6d4", "#f97316", "#84cc16"];

/** 8-color hex palette for the active preset: series colors, gradients, visualMap stops. */
export function chartPalette(scope: Element | null = null): string[] {
	if (typeof document === "undefined") return PRESET_PALETTES.amber;
	trackTheme();
	const el = scope ?? document.documentElement;
	// The nearest `data-preset` wins, like the CSS: an island's own preset, else the page's.
	const preset = el.closest("[data-preset]")?.getAttribute("data-preset") ?? "";
	const builtin = PRESET_PALETTES[preset as BuiltinPresetId];
	if (builtin) return builtin;
	// Brand presets (ThemeOptions.presets) publish their hex as --ca-chart-brand.
	const brand = getComputedStyle(el).getPropertyValue("--ca-chart-brand").trim();
	return brand ? [brand, ...BRAND_REST] : PRESET_PALETTES.amber;
}

/** Add alpha to hex (#rrggbb) or rgb(...). oklch/color-mix returned as-is (canvas can't use them anyway). */
export function withAlpha(color: string, alpha: number): string {
	if (color.startsWith("#") && color.length >= 7) {
		const r = Number.parseInt(color.slice(1, 3), 16);
		const g = Number.parseInt(color.slice(3, 5), 16);
		const b = Number.parseInt(color.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${alpha})`;
	}
	if (color.startsWith("rgb")) {
		const m = color.match(/[\d.]+/g) ?? [];
		return `rgba(${m[0]},${m[1]},${m[2]},${alpha})`;
	}
	return color;
}

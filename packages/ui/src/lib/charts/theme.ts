// ─── Glass chart theme — internal only ─────────────────────────────────────────
// Every public chart component funnels its ECharts option through
// `withChartTheme()`. Consumers never see or configure any of this.
//
// Hover design rules (do not violate — regressions were painful to fix):
// 1. NO blur/focus:'series' on line charts — dimming makes lines disappear.
// 2. axisPointer: 'line' for line/scatter, 'shadow' for bar (auto-detected).
// 3. Emphasis = enlarge/glow the hovered element, leave others untouched.
// 4. Canvas API colors must be hex/rgba — oklch from chartTokens() won't work.

import type { EChartsOption } from "echarts";
import { chartPalette } from "./palette.js";
import { type ChartTokens, chartTokens } from "./tokens.js";

// ── Tooltip ────────────────────────────────────────────────────────────────────

export function chartTooltip(t: ChartTokens = chartTokens()): EChartsOption["tooltip"] {
	return {
		backgroundColor: "transparent",
		borderWidth: 0,
		padding: 0,
		confine: true,
		transitionDuration: 0,
		textStyle: { color: t.textPrimary, fontFamily: t.fontSans, fontSize: 12 },
		extraCssText: [
			`background:${t.glassBg}`,
			`backdrop-filter:${t.blur}`,
			`-webkit-backdrop-filter:${t.blur}`,
			`border:1px solid ${t.glassBorder}`,
			`border-radius:${t.radiusMd}`,
			`box-shadow:${t.glassShadow}`,
			"padding:10px 14px",
			`color:${t.textPrimary}`,
			`font-family:${t.fontSans}`,
			"font-size:12px",
			"line-height:1.7",
			"min-width:128px",
			"pointer-events:none",
		].join(";"),
	};
}

// ── Axis pointer — chart-type aware crosshair ─────────────────────────────────

export type AxisPointerType = "line" | "shadow" | "none";

export function chartAxisPointer(
	type: AxisPointerType,
	t: ChartTokens = chartTokens(),
	scope: Element | null = null
): object {
	if (type === "none") return {};
	if (type === "shadow") {
		return { type: "shadow", shadowStyle: { color: "rgba(150,150,150,0.06)" } };
	}
	return {
		type: "line",
		lineStyle: { color: withAlphaFirst(t, scope), type: "dashed", width: 1 },
		label: {
			backgroundColor: t.glassBg,
			borderColor: t.glassBorder,
			borderWidth: 1,
			color: t.textPrimary,
			fontFamily: t.fontSans,
			fontSize: 11,
			padding: [4, 8],
		},
	};
}

function withAlphaFirst(_t: ChartTokens, scope: Element | null = null): string {
	const [first] = chartPalette(scope);
	return hexToRgba(first, 0.45);
}

function hexToRgba(hex: string, alpha: number): string {
	if (!hex.startsWith("#")) return hex;
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

// ── Axis ───────────────────────────────────────────────────────────────────────

export function chartAxis(t: ChartTokens = chartTokens()): { xAxis: object; yAxis: object } {
	const shared = {
		axisLine: { lineStyle: { color: t.outlineSubtle } },
		axisTick: { show: false },
		splitLine: { lineStyle: { color: t.outlineSubtle, type: "dashed" as const } },
		axisLabel: {
			color: t.textDisabled,
			fontFamily: t.fontSans,
			fontSize: 11,
			fontWeight: "400",
			margin: 8,
		},
		nameTextStyle: { color: t.textDisabled, fontFamily: t.fontSans, fontSize: 11 },
	};
	return { xAxis: shared, yAxis: shared };
}

// ── Legend ─────────────────────────────────────────────────────────────────────

export function chartLegend(t: ChartTokens = chartTokens()): EChartsOption["legend"] {
	return {
		textStyle: { color: t.textSecondary, fontFamily: t.fontSans, fontSize: 12, fontWeight: 500 },
		icon: "roundRect",
		itemWidth: 8,
		itemHeight: 8,
		itemGap: 14,
		inactiveColor: t.textDisabled,
		inactiveBorderColor: "transparent",
	};
}

// ── Master merge ───────────────────────────────────────────────────────────────

/**
 * Deep-merges the glass theme into a raw EChartsOption. Caller overrides win.
 *
 * axisPointer is auto-detected:
 *   - `tooltip.trigger === 'item'` (pie/gauge/radar) → none
 *   - any series with `type: 'bar'` → shadow
 *   - everything else → line crosshair
 */
export function withChartTheme(option: EChartsOption, scope: Element | null = null): EChartsOption {
	const t = chartTokens(scope);
	const palette = chartPalette(scope);
	const ax = chartAxis(t);

	const callerTrigger = (option.tooltip as Record<string, unknown> | undefined)?.trigger;
	const isItemTrigger = callerTrigger === "item";

	const callerAP = (
		(option.tooltip as Record<string, unknown> | undefined)?.axisPointer as
			| Record<string, unknown>
			| undefined
	)?.type;
	const hasBar =
		!isItemTrigger &&
		Array.isArray(option.series) &&
		(option.series as Record<string, unknown>[]).some((s) => s?.type === "bar");
	const apType: AxisPointerType = isItemTrigger
		? "none"
		: callerAP === "shadow"
			? "shadow"
			: callerAP === "line"
				? "line"
				: hasBar
					? "shadow"
					: "line";

	const cartesianDefaults = isItemTrigger
		? {}
		: {
				grid: { top: 36, right: 16, bottom: 36, left: 48, containLabel: true },
				xAxis: ax.xAxis,
				yAxis: ax.yAxis,
			};

	const base: EChartsOption = {
		backgroundColor: "transparent",
		color: palette,
		textStyle: { fontFamily: t.fontSans, fontSize: 12, color: t.textPrimary },
		tooltip: isItemTrigger
			? { ...chartTooltip(t), trigger: "item" }
			: { ...chartTooltip(t), trigger: "axis", axisPointer: chartAxisPointer(apType, t, scope) },
		legend: chartLegend(t),
		...cartesianDefaults,
	};

	return deepMerge(base, option) as EChartsOption;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/** Naive deep merge — plain objects only; arrays from b win outright. */
function deepMerge(a: object, b: object): object {
	const out: Record<string, unknown> = { ...a };
	for (const [k, bv] of Object.entries(b)) {
		const av = (a as Record<string, unknown>)[k];
		out[k] = isPlain(av) && isPlain(bv) ? deepMerge(av as object, bv as object) : bv;
	}
	return out;
}

function isPlain(val: unknown): val is object {
	return typeof val === "object" && val !== null && !Array.isArray(val);
}

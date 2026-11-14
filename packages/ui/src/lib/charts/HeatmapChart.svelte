<script lang="ts">
  import { charts } from '../i18n/groups/charts.js';
  import { useMessages } from '../i18n/state.svelte.js';
	// ─── HeatmapChart — calendar or matrix heatmap ───────────────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import { canvasColor, chartPalette, withAlpha } from "./palette.js";
	import { chartTokens } from "./tokens.js";
	import type { CalendarHeatmapPoint, MatrixHeatmapPoint } from "./types.js";
  const msg = useMessages(charts);

	interface Props {
		variant: "calendar" | "matrix";
		// calendar
		data?: CalendarHeatmapPoint[];
		range?: [string, string];
		// matrix
		matrixData?: MatrixHeatmapPoint[];
		xCategories?: string[];
		yCategories?: string[];
		/** matrix: the alternating axis bands behind the cells. Off: in dark mode they showed through empty cells as a
		 * checkerboard that read like data (#1061). */
		bands?: boolean;
		/** matrix: the `visualMap` scale under the chart (static, not draggable). `false` hides it; colours still map. */
		legend?: boolean;
		/** matrix: fill of a cell at 0, the start of the ramp. Default: the theme's `--ca-surface-sunken`. */
		emptyColor?: string;
		// shared
		color?: string;
		max?: number;
		tooltipFormatter?: (value: number) => string;
		height?: string;
		class?: string;
	}

	let {
		variant,
		data = [],
		range,
		matrixData = [],
		xCategories = [],
		yCategories = [],
		bands = false,
		legend = true,
		emptyColor,
		color,
		max,
		tooltipFormatter,
		height = "240px",
		class: className = "",
	}: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	function buildCalendarOption(
		t: ReturnType<typeof chartTokens>,
		palette: string[],
	): EChartsOption {
		const rampColor = color ?? palette[0];
		const dataMax = max ?? Math.max(0, ...data.map((d) => d[1]));
		return withChartTheme({
			tooltip: {
				trigger: "item",
				formatter: (p: any) => {
					const v = p.value[1];
					return `${p.value[0]}: <b>${tooltipFormatter ? tooltipFormatter(v) : v}</b>`;
				},
			},
			visualMap: {
				show: false,
				min: 0,
				max: dataMax,
				inRange: { color: ["rgba(255,255,255,0.04)", rampColor] },
			},
			calendar: {
				top: 24,
				left: 36,
				right: 12,
				range,
				cellSize: ["auto", 14],
				splitLine: { show: false },
				itemStyle: { borderRadius: 3, borderWidth: 0 },
				dayLabel: { firstDay: 1, color: t.textDisabled, fontSize: 10, fontFamily: t.fontSans },
				monthLabel: { color: t.textSecondary, fontSize: 11, fontFamily: t.fontSans },
				yearLabel: { show: false },
			},
			series: [
				{
					type: "heatmap",
					coordinateSystem: "calendar",
					animationDuration: 800,
					animationEasing: "cubicOut",
					data,
				},
			],
		}, scope.el);
	}

	function buildMatrixOption(
		t: ReturnType<typeof chartTokens>,
		palette: string[],
	): EChartsOption {
		const rampColor = color ?? palette[0];
		// Theme tokens are oklch; a visualMap stop has to be rgb (canvasColor).
		const empty = canvasColor(emptyColor ?? t.surfaceSunken);
		const dataMax = max ?? Math.max(0, ...matrixData.map((d) => d[2]));
		return withChartTheme({
			// Without the legend its ~64 px band goes back to the cells.
			grid: { top: 32, right: 20, bottom: legend ? 64 : 24, left: 56 },
			xAxis: {
				type: "category",
				data: xCategories,
				splitArea: { show: bands },
				axisLabel: { fontSize: 10, color: t.textDisabled, fontFamily: t.fontSans },
				axisTick: { show: false },
				axisLine: { show: false },
			},
			yAxis: {
				type: "category",
				data: yCategories,
				splitArea: { show: bands },
				axisLabel: { fontSize: 11, color: t.textSecondary, fontFamily: t.fontSans },
				axisTick: { show: false },
				axisLine: { show: false },
			},
			tooltip: {
				trigger: "item",
				formatter: (p: any) => {
					const [x, y, v] = p.value;
					const label = tooltipFormatter ? tooltipFormatter(v) : String(v);
					return `${yCategories[y] ?? y} ${xCategories[x] ?? x}: <b>${label}</b>`;
				},
			},
			visualMap: {
				show: legend,
				min: 0,
				max: dataMax,
				// A scale to read, not a range filter: the drag handles invited a control nobody needs.
				calculable: false,
				orient: "horizontal",
				left: "center",
				bottom: 4,
				itemHeight: 120,
				text: [msg().charts.high, msg().charts.low],
				textStyle: { color: t.textSecondary, fontSize: 11, fontFamily: t.fontSans },
				inRange: { color: [empty, rampColor] },
			},
			series: [
				{
					type: "heatmap",
					data: matrixData,
					coordinateSystem: "cartesian2d",
					itemStyle: { borderRadius: 3 },
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowColor: withAlpha(rampColor, 0.4),
						},
					},
					animationDuration: 800,
					animationDelay: (idx: number) => idx * 2,
				},
			],
		}, scope.el);
	}

	const option = $derived.by<EChartsOption>(() => {
		const t = chartTokens(scope.el);
		const palette = chartPalette(scope.el);
		return variant === "calendar"
			? buildCalendarOption(t, palette)
			: buildMatrixOption(t, palette);
	});
</script>

<ChartCanvas {option} {height} class={className} />

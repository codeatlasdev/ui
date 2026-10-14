<script lang="ts">
  import { useT } from '../i18n/state.svelte.js';
	// ─── HeatmapChart — calendar or matrix heatmap ───────────────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { withChartTheme } from "./theme.js";
	import { chartPalette, withAlpha } from "./palette.js";
	import { chartTokens } from "./tokens.js";
	import type { CalendarHeatmapPoint, MatrixHeatmapPoint } from "./types.js";
  const msg = useT();

	interface Props {
		variant: "calendar" | "matrix";
		// calendar
		data?: CalendarHeatmapPoint[];
		range?: [string, string];
		// matrix
		matrixData?: MatrixHeatmapPoint[];
		xCategories?: string[];
		yCategories?: string[];
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
		color,
		max,
		tooltipFormatter,
		height = "240px",
		class: className = "",
	}: Props = $props();

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
		});
	}

	function buildMatrixOption(
		t: ReturnType<typeof chartTokens>,
		palette: string[],
	): EChartsOption {
		const rampColor = color ?? palette[0];
		const dataMax = max ?? Math.max(0, ...matrixData.map((d) => d[2]));
		return withChartTheme({
			grid: { top: 32, right: 20, bottom: 64, left: 56 },
			xAxis: {
				type: "category",
				data: xCategories,
				splitArea: { show: true },
				axisLabel: { fontSize: 10, color: t.textDisabled, fontFamily: t.fontSans },
				axisTick: { show: false },
				axisLine: { show: false },
			},
			yAxis: {
				type: "category",
				data: yCategories,
				splitArea: { show: true },
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
				min: 0,
				max: dataMax,
				calculable: true,
				orient: "horizontal",
				left: "center",
				bottom: 4,
				itemHeight: 120,
				text: [msg().charts.high, msg().charts.low],
				textStyle: { color: t.textSecondary, fontSize: 11, fontFamily: t.fontSans },
				inRange: { color: ["rgba(255,255,255,0.04)", rampColor] },
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
		});
	}

	const option = $derived.by<EChartsOption>(() => {
		const t = chartTokens();
		const palette = chartPalette();
		return variant === "calendar"
			? buildCalendarOption(t, palette)
			: buildMatrixOption(t, palette);
	});
</script>

<ChartCanvas {option} {height} class={className} />

<script lang="ts">
	// ─── Sparkline — minimal inline chart, no axes/legend/tooltip chrome ─────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { lineSeries } from "./series/line.js";
	import { barSeries } from "./series/bar.js";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import { chartTokens } from "./tokens.js";
	import type { SparklineTrend } from "./types.js";

	interface Props {
		data: number[];
		variant?: "line" | "bar";
		trend?: SparklineTrend;
		color?: string;
		height?: string;
		class?: string;
	}

	let { data, variant = "line", trend, color, height = "48px", class: className = "" }: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived.by<EChartsOption>(() => {
		const t = chartTokens(scope.el);
		const resolvedColor =
			color ?? (trend === "up" ? t.success : trend === "down" ? t.error : t.textSecondary);

		const series =
			variant === "bar"
				? barSeries({
						data,
						itemStyle: { color: resolvedColor, borderRadius: [2, 2, 0, 0] },
						barMaxWidth: 6,
						animationDuration: 500,
					})
				: lineSeries({
						data,
						showSymbol: false,
						lineStyle: { color: resolvedColor, width: 2 },
						areaStyle: { color: resolvedColor, opacity: 0.12 },
						animationDuration: 600,
					});

		return withChartTheme({
			// Sparklines: suppress all chrome; override withChartTheme cartesian defaults.
			grid: { top: 4, right: 2, bottom: 4, left: 2 },
			xAxis: { type: "category", show: false, data: data.map((_, i) => i) },
			yAxis: { type: "value", show: false },
			tooltip: { show: false },
			legend: { show: false },
			series: [series],
		}, scope.el);
	});
</script>

<ChartCanvas {option} {height} class={className} />

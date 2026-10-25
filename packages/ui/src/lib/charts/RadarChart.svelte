<script lang="ts">
	// ─── RadarChart — indicators + multi-series ─────────────────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import { chartTokens } from "./tokens.js";
	import type { RadarIndicator, RadarSeries } from "./types.js";

	interface Props {
		indicators: RadarIndicator[];
		series: RadarSeries[];
		height?: string;
		class?: string;
	}

	let { indicators, series, height = "340px", class: className = "" }: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived.by<EChartsOption>(() => {
		const t = chartTokens(scope.el);
		return withChartTheme({
			tooltip: { trigger: "item" },
			legend: series.length > 1 ? { data: series.map((s) => s.name) } : undefined,
			radar: {
				radius: "65%",
				indicator: indicators,
				splitArea: { areaStyle: { opacity: 0.03 } },
				splitLine: { lineStyle: { color: t.outlineSubtle } },
				axisName: { color: t.textSecondary, fontFamily: t.fontSans, fontSize: 12 },
			},
			series: [
				{
					type: "radar",
					animationDuration: 1000,
					animationEasing: "cubicOut",
					...(series.length > 1 ? { emphasis: { focus: "self" } } : {}),
					data: series.map((s) => ({
						name: s.name,
						value: s.values,
						areaStyle: { opacity: series.length > 1 ? 0.15 : 0.2 },
						...(s.color ? { itemStyle: { color: s.color }, lineStyle: { color: s.color } } : {}),
					})),
				},
			],
		}, scope.el);
	});
</script>

<ChartCanvas {option} {height} class={className} />

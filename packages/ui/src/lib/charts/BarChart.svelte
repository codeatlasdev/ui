<script lang="ts">
	// ─── BarChart — pass data, get a themed chart ────────────────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { barSeries } from "./series/bar.js";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import type { ChartSeries } from "./types.js";

	interface Props {
		series: ChartSeries[];
		categories: string[];
		valueFormatter?: (value: number) => string;
		/** Render bars horizontally instead of vertically. */
		horizontal?: boolean;
		/** Stack all series into one column per category. */
		stacked?: boolean;
		height?: string;
		class?: string;
	}

	let {
		series,
		categories,
		valueFormatter,
		horizontal = false,
		stacked = false,
		height = "320px",
		class: className = "",
	}: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived<EChartsOption>(
		withChartTheme({
			xAxis: horizontal
				? { type: "value", axisLabel: valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined }
				: { type: "category", data: categories },
			yAxis: horizontal
				? { type: "category", data: categories }
				: { type: "value", axisLabel: valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined },
			tooltip: valueFormatter ? { valueFormatter: (v) => valueFormatter(v as number) } : undefined,
			series: series.map((s) =>
				barSeries({
					name: s.name,
					data: s.data,
					...(stacked ? { stack: "total" } : {}),
					...(s.color ? { itemStyle: { color: s.color, borderRadius: [6, 6, 0, 0] } } : {}),
				}),
			),
		}, scope.el),
	);
</script>

<ChartCanvas {option} {height} class={className} />

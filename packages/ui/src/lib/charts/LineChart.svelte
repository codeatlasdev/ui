<script lang="ts">
	// ─── LineChart — pass data, get a themed chart ───────────────────────────────
	// No style/color/font props on purpose: the design system owns presentation.
	// Escape hatch: `option` merges raw ECharts overrides last, for the rare case
	// this component's surface doesn't cover.
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { lineSeries } from "./series/line.js";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import type { ChartSeries } from "./types.js";

	interface Props {
		/** One or more named series sharing the same category axis. */
		series: ChartSeries[];
		/** X-axis labels, one per data point. */
		categories: string[];
		/** Formats y-axis ticks and tooltip values, e.g. `(v) => \`$${v}k\`` */
		valueFormatter?: (value: number) => string;
		/** Fills the area under each line with a gradient down to transparent. */
		area?: boolean;
		height?: string;
		class?: string;
	}

	let { series, categories, valueFormatter, area = false, height = "320px", class: className = "" }: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived<EChartsOption>(
		withChartTheme({
			xAxis: { type: "category", data: categories, boundaryGap: area },
			yAxis: {
				type: "value",
				axisLabel: valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined,
			},
			tooltip: valueFormatter
				? { valueFormatter: (v) => valueFormatter(v as number) }
				: undefined,
			series: series.map((s) =>
				lineSeries({
					name: s.name,
					data: s.data,
					...(s.color ? { color: s.color, lineStyle: { color: s.color }, itemStyle: { color: s.color } } : {}),
					...(area ? { areaStyle: {} } : {}),
				}),
			),
		}, scope.el),
	);

	const gradientSeries = $derived(area ? series.map((_, i) => i) : []);
</script>

<ChartCanvas {option} {height} class={className} {gradientSeries} />

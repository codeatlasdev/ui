<script lang="ts">
	// ─── ScatterChart — pass series of [x,y] or [x,y,size] points ───────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { scatterSeries, bubbleSymbolSize } from "./series/scatter.js";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import type { ScatterSeries } from "./types.js";

	interface Props {
		series: ScatterSeries[];
		xName?: string;
		yName?: string;
		xFormatter?: (v: number) => string;
		yFormatter?: (v: number) => string;
		valueFormatter?: (v: number) => string;
		height?: string;
		class?: string;
	}

	let { series, xName, yName, xFormatter, yFormatter, valueFormatter, height = "320px", class: className = "" }: Props =
		$props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived.by<EChartsOption>(() => {
		// Auto-detect bubble mode from any point with a 3rd dimension
		const allPoints = series.flatMap((s) => s.data);
		const isBubble = allPoints.some((p) => p.length === 3);
		const maxSize = isBubble ? Math.max(...allPoints.map((p) => (p[2] as number | undefined) ?? 0)) : 0;
		const fmtX = xFormatter ?? valueFormatter;
		const fmtY = yFormatter ?? valueFormatter;

		return withChartTheme({
			grid: { top: 40, right: 16, bottom: 40, left: 16, containLabel: true },
			xAxis: {
				type: "value",
				scale: true,
				axisLabel: fmtX ? { formatter: (v: number) => fmtX(v) } : undefined,
			},
			yAxis: {
				type: "value",
				name: yName,
				nameLocation: "end",
				nameTextStyle: { align: "left" },
				scale: true,
				axisLabel: fmtY ? { formatter: (v: number) => fmtY(v) } : undefined,
			},
			tooltip: {
				trigger: "item",
				formatter: (p: any) => {
					const [x, y, z] = p.value;
					const xs = fmtX ? fmtX(x) : String(x);
					const ys = fmtY ? fmtY(y) : String(y);
					return isBubble ? `${xs} / ${ys}<br/>Size: <b>${z}</b>` : `${xs} / <b>${ys}</b>`;
				},
			},
			series: series.map((s) =>
				scatterSeries({
					name: s.name,
					data: s.data,
					...(s.color ? { itemStyle: { color: s.color } } : {}),
					...(isBubble ? { symbolSize: bubbleSymbolSize(6, 40, maxSize) } : {}),
				}),
			),
		}, scope.el);
	});
</script>

<ChartCanvas {option} {height} class={className} />

<script lang="ts">
	// ─── GaugeChart — KPI gauge, progress ring ───────────────────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { withChartTheme } from "./theme.js";
	import { useChartScope } from "./tokens.js";
	import { chartTokens, resolveZoneColor } from "./tokens.js";
	import type { GaugeZone } from "./types.js";

	const DEFAULT_ZONES: GaugeZone[] = [
		{ until: 0.3, color: "error" },
		{ until: 0.7, color: "warning" },
		{ until: 1, color: "success" },
	];

	interface Props {
		value: number;
		min?: number;
		max?: number;
		variant?: "default" | "ring";
		zones?: GaugeZone[];
		label?: string;
		formatter?: (value: number) => string;
		animated?: boolean;
		height?: string;
		class?: string;
	}

	let {
		value,
		min = 0,
		max = 100,
		variant = "default",
		zones = DEFAULT_ZONES,
		label,
		formatter,
		animated = true,
		height = "280px",
		class: className = "",
	}: Props = $props();
	// Tokens come from the theme island this chart sits in (the page when there is none).
	const scope = useChartScope();

	const option = $derived.by<EChartsOption>(() => {
		const t = chartTokens(scope.el);
		const fmt = formatter ?? ((v: number) => `${v}%`);

		const seriesBase = {
			type: "gauge" as const,
			min,
			max,
			data: [{ value, name: label ?? "" }],
			animationDuration: 1200,
			animationEasing: "cubicOut" as const,
			axisTick: { show: false },
			splitLine: { show: false },
			axisLabel: { show: false },
		};

		const detail = {
			valueAnimation: animated,
			formatter: (v: number) => fmt(v),
			fontFamily: t.fontSans,
			color: t.textPrimary,
		};

		if (variant === "ring") {
			return withChartTheme({
				tooltip: { trigger: "item" },
				series: [
					{
						...seriesBase,
						startAngle: 90,
						endAngle: -270,
						radius: "80%",
						pointer: { show: false },
						axisLine: {
							lineStyle: {
								width: 8,
								color: [
									[value / max, t.brand],
									[1, t.outlineSubtle],
								],
							},
						},
						detail: { ...detail, fontSize: 36, fontWeight: "bold", offsetCenter: [0, 0] },
					},
				],
			}, scope.el);
		}

		return withChartTheme({
			tooltip: { trigger: "item" },
			series: [
				{
					...seriesBase,
					startAngle: 200,
					endAngle: -20,
					pointer: { width: 4, itemStyle: { color: "auto" } },
					axisLine: {
						lineStyle: {
							width: 18,
							color: zones.map((z) => [z.until, resolveZoneColor(z.color, t)]),
						},
					},
					detail: { ...detail, fontSize: 28, fontWeight: "bold", offsetCenter: [0, "60%"] },
					...(label
						? {
								title: {
									offsetCenter: [0, "-20%"],
									fontFamily: t.fontSans,
									color: t.textSecondary,
									fontSize: 12,
								},
							}
						: {}),
				},
			],
		}, scope.el);
	});
</script>

<ChartCanvas {option} {height} class={className} />

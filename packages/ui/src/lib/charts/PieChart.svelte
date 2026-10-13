<script lang="ts">
	// ─── PieChart — pass slices, get a themed donut/pie/rose ─────────────────────
	import type { EChartsOption } from "echarts";
	import ChartCanvas from "./ChartCanvas.svelte";
	import { pieSeries } from "./series/pie.js";
	import { withChartTheme } from "./theme.js";
	import type { ChartSlice } from "./types.js";

	interface Props {
		data: ChartSlice[];
		/** Renders as a donut (ring) instead of a solid pie. */
		donut?: boolean;
		/** Nightingale rose — slice radius scales with value. */
		rose?: boolean;
		/** Overlay text centered in a donut (e.g. a KPI total). Requires `donut`. */
		centerLabel?: { value: string; label: string };
		height?: string;
		class?: string;
	}

	let { data, donut = false, rose = false, centerLabel, height = "300px", class: className = "" }: Props = $props();

	const option = $derived<EChartsOption>(
		withChartTheme({
			tooltip: { trigger: "item", formatter: "{b}: <b>{d}%</b>" },
			legend: { bottom: "2%", left: "center", orient: "horizontal" },
			series: [
				pieSeries({
					radius: rose ? ["20%", "70%"] : donut ? ["42%", "68%"] : ["0%", "68%"],
					center: ["50%", "46%"],
					roseType: rose ? "radius" : undefined,
					label: rose ? { show: true, fontSize: 11 } : { show: false },
					data,
				}),
			],
		}),
	);
</script>

{#if centerLabel}
{#snippet kpiOverlay()}
<div class="ca-pie-center">
	<span class="ca-pie-center__value">{centerLabel.value}</span>
	<span class="ca-pie-center__label">{centerLabel.label}</span>
</div>
{/snippet}
<ChartCanvas {option} {height} class={className} overlay={kpiOverlay} />
{:else}
<ChartCanvas {option} {height} class={className} />
{/if}

<style>
	.ca-pie-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ca-space-0-5);
		pointer-events: none;
		transform: translateY(-8%);
	}
	.ca-pie-center__value {
		font-size: var(--ca-font-size-h3);
		font-weight: var(--ca-font-weight-bold);
		line-height: 1.1;
		color: var(--ca-text-primary);
		font-family: var(--ca-font-sans);
	}
	.ca-pie-center__label {
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-hint);
		font-family: var(--ca-font-sans);
		letter-spacing: var(--ca-label-tracking);
	}
</style>

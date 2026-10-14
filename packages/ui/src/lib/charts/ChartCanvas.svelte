<script lang="ts">
	// ─── Low-level ECharts mount wrapper — internal ──────────────────────────────
	// Public chart components (LineChart, BarChart, ...) build a themed
	// EChartsOption and hand it here. Not exported from the package root;
	// consumers never touch ECharts directly.
	import { onDestroy, onMount } from "svelte";
	import type { Snippet } from "svelte";
	import type { ECharts, EChartsOption } from "echarts";
	import { chartGradient } from "./gradient.js";
	import { chartPalette } from "./palette.js";

	interface Props {
		option: EChartsOption;
		height?: string;
		class?: string;
		/**
		 * Series indices that should get a canvas gradient area fill.
		 * Resolved against the series' own lineStyle.color → itemStyle.color →
		 * palette. Public chart components pass this; consumers never see it.
		 */
		gradientSeries?: number[];
		/** pointer-events:none overlay slot (e.g. center KPI label in a donut). */
		overlay?: Snippet;
	}

	let { option, height = "320px", class: className = "", gradientSeries = [], overlay }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let chart = $state<ECharts | null>(null);
	// Module-level so onDestroy can disconnect even if onMount's async chain
	// hasn't fully resolved before unmount.
	let ec: typeof import("echarts/core") | null = null;
	let ro: ResizeObserver | null = null;

	function applyGradients(opt: EChartsOption): EChartsOption {
		if (!ec || !gradientSeries.length) return opt;
		const series = Array.isArray(opt.series) ? [...opt.series] : [];
		if (!series.length) return opt;
		const palette = chartPalette();
		const patched = series.map((s, i) => {
			if (!gradientSeries.includes(i) || !s || typeof s !== "object") return s;
			const row = s as Record<string, unknown>;
			const lineColor = (row.lineStyle as Record<string, unknown> | undefined)?.color as string | undefined;
			const itemColor = (row.itemStyle as Record<string, unknown> | undefined)?.color as string | undefined;
			const color =
				(typeof lineColor === "string" ? lineColor : null) ??
				(typeof itemColor === "string" ? itemColor : null) ??
				palette[i % palette.length];
			return { ...s, areaStyle: { ...(row.areaStyle as object | undefined), color: chartGradient(ec as any, color) } };
		});
		return { ...opt, series: patched as EChartsOption["series"] };
	}

	// Keep onMount synchronous so Svelte receives the cleanup function.
	// async onMount returns a Promise — Svelte can't call it as cleanup.
	onMount(() => {
		import("./echarts.js").then(({ default: echarts }) => {
			if (!container) return;
			ec = echarts;
			chart = echarts.init(container, null, { renderer: "canvas", locale: "EN" });
			chart.setOption(applyGradients(option));
			// rAF ensures flex/grid layout has settled before reading dimensions
			requestAnimationFrame(() => chart?.resize());
			ro = new ResizeObserver(() => chart?.resize());
			ro.observe(container);
		});
		return () => {
			ro?.disconnect();
			chart?.dispose();
		};
	});

	// Re-apply whenever the built option changes: new data, or a theme change (chart options
	// read tokens through `trackTheme`, so they re-derive when the scheme/preset/style flips).
	$effect(() => {
		if (chart) chart.setOption(applyGradients(option), { notMerge: false, lazyUpdate: false });
	});

	onDestroy(() => {
		ro?.disconnect();
		chart?.dispose();
	});
</script>

<div class="ca-chart-wrap {className}" style="--chart-h:{height}">
	<div bind:this={container} class="ca-chart-container"></div>
	{#if overlay}
		<div class="ca-chart-overlay">
			{@render overlay()}
		</div>
	{/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	.ca-chart-wrap {
  		position: relative;
  		height: var(--chart-h, 300px);
  		border-radius: var(--ca-radius-lg);
  		overflow: hidden;
  	}

  	.ca-chart-container {
  		width: 100%;
  		height: 100%;
  	}
  	.ca-chart-overlay {
  		position: absolute;
  		inset: 0;
  		pointer-events: none;
  		display: flex;
  		align-items: center;
  		justify-content: center;
  	}
}
</style>

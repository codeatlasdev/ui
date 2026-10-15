<script lang="ts">
	// The hero focal point: a compact product surface made only of real @codeatlasdev/ui components.
	// It cycles presets, surface styles and the dark scope by setting attributes on its own wrapper
	// (theme islands), which is the same mechanism apps use. Nothing here is imagery.
	import {
		Button,
		Chip,
		Card,
		KpiCard,
		SegmentedControl,
		StatusChip,
		Switch,
		type SurfaceStyle,
	} from "@codeatlasdev/ui";
	import { Activity, Boxes, Gauge, Layers, Rocket, Users } from "@lucide/svelte";
	import { onMount } from "svelte";

	const PRESETS = ["amber", "ocean", "violet", "emerald", "rose", "cyan"] as const;
	const STYLES: SurfaceStyle[] = ["glass", "frosted", "solid", "flat"];

	let presetIdx = $state(0);
	let styleIdx = $state(0);
	let dark = $state(true);
	let auto = $state(true);
	let live = $state(false);
	let stopTimer = () => {};

	const preset = $derived(PRESETS[presetIdx]);
	const style = $derived(STYLES[styleIdx]);
	const scope = $derived(dark ? "dark" : "light");

	const revenue = [14, 18, 15, 22, 19, 27, 24, 31, 29, 36, 33, 41];
	const traffic = [9, 12, 8, 14, 11, 16, 13, 12, 18, 15, 20, 19];

	// Data graphic, drawn from the numbers above. Paints on the server and without JS, and takes its
	// color from the active preset (currentColor), unlike a canvas chart that needs the client.
	function spark(data: number[], w: number, h: number) {
		const max = Math.max(...data);
		const min = Math.min(...data);
		const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
		const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
		return { line, area: `${line} L${w} ${h} L0 ${h} Z` };
	}
	const lineA = spark(revenue, 320, 64);
	const bars = traffic.map((v, i) => ({ x: i * 26.6 + 2, h: 4 + ((v - 8) / 12) * 32 }));

	// One beat every 2.6s: preset moves each beat, surface style every second beat, scheme every fourth.
	let beat = 0;
	function step() {
		beat += 1;
		presetIdx = (presetIdx + 1) % PRESETS.length;
		if (beat % 2 === 0) styleIdx = (styleIdx + 1) % STYLES.length;
		if (beat % 4 === 0) dark = !dark;
	}

	onMount(() => {
		live = true;
		const reduce = matchMedia("(prefers-reduced-motion: reduce)");
		let timer: ReturnType<typeof setInterval> | undefined;
		const sync = () => {
			if (timer) clearInterval(timer);
			timer = undefined;
			if (auto && !reduce.matches && !document.hidden) timer = setInterval(step, 2600);
		};
		stopTimer = () => {
			auto = false;
			sync();
		};
		sync();
		document.addEventListener("visibilitychange", sync);
		reduce.addEventListener("change", sync);
		return () => {
			if (timer) clearInterval(timer);
			document.removeEventListener("visibilitychange", sync);
			reduce.removeEventListener("change", sync);
		};
	});

	function pick(i: number) {
		stopTimer();
		presetIdx = i;
	}
</script>

<div class="stage" data-preset={preset} data-style={style} data-live={live ? "" : undefined}>
	<!-- Theme island: [data-preset] on the wrapper, [data-theme-scope] on the descendant that repaints. -->
	<div class="stage__surface" data-theme-scope={scope}>
		<header class="stage__bar">
			<div class="stage__brand">
				<Layers size={16} aria-hidden="true" />
				<strong>Northwind</strong>
			</div>
			<StatusChip status="success" label="All systems normal" />
		</header>

		<div class="stage__grid">
			<KpiCard title="Revenue" value="41.2" unit="k" trend={12.4} icon={Gauge} />
			<KpiCard title="Active teams" value="1,284" trend={4.1} icon={Users} />

			<Card material="glass" elevation={4} class="stage__chart">
				<p class="stage__chart-title">Weekly growth</p>
				<svg class="stage__spark" viewBox="0 0 320 64" preserveAspectRatio="none" role="img" aria-label="Revenue rising from 14 to 41 over 12 weeks">
					<path d={lineA.area} class="stage__area" />
					<path d={lineA.line} class="stage__line" vector-effect="non-scaling-stroke" />
				</svg>
				<svg class="stage__spark stage__spark--bars" viewBox="0 0 320 40" preserveAspectRatio="none" role="img" aria-label="Weekly traffic, 12 bars">
					{#each bars as b}
						<rect x={b.x} y={40 - b.h} width="16" height={b.h} rx="2" class="stage__bar-rect" />
					{/each}
				</svg>
			</Card>

			<Card material="glass" class="stage__controls" title="Release">
				<div class="stage__row">
					<Chip label="v2 rollout" icon={Rocket} variant="brand" size="sm" />
					<Chip label="Beta" icon={Boxes} size="sm" />
					<Chip label="Live" icon={Activity} variant="success" size="sm" />
				</div>
				<div class="stage__row stage__row--between">
					<Switch checked label="Auto deploy" aria-label="Auto deploy" />
				</div>
				<div class="stage__row">
					<Button size="sm">Ship it</Button>
					<Button size="sm" variant="glass">Preview</Button>
				</div>
			</Card>
		</div>
	</div>

	<div class="stage__dock" aria-label="Theme controls for the live preview">
		<div class="stage__swatches" role="group" aria-label="Preset">
			{#each PRESETS as p, i}
				<button
					type="button"
					class="swatch"
					data-preset={p}
					aria-pressed={presetIdx === i}
					aria-label={`Preset ${p}`}
					onclick={() => pick(i)}
				></button>
			{/each}
		</div>
		<SegmentedControl
			size="sm"
			aria-label="Surface style"
			value={style}
			items={STYLES.map((s) => ({ value: s, label: s }))}
			onchange={(v) => {
				stopTimer();
				styleIdx = STYLES.indexOf(v as SurfaceStyle);
			}}
		/>
		<Button
			size="sm"
			variant="ghost"
			aria-pressed={dark}
			onclick={() => {
				stopTimer();
				dark = !dark;
			}}>{dark ? "Dark" : "Light"}</Button
		>
	</div>
</div>

<style>
	.stage {
		display: grid;
		gap: var(--ca-space-4);
		min-width: 0;
	}
	/* The island repaints its own ground: surface tokens re-resolve through data-theme-scope. */
	.stage__surface {
		position: relative;
		padding: var(--ca-space-5);
		border-radius: var(--ca-radius-xl);
		background:
			radial-gradient(
				ellipse 70% 60% at 0% 0%,
				color-mix(in oklab, var(--ca-brand-main) 38%, transparent),
				transparent 62%
			),
			radial-gradient(
				ellipse 60% 55% at 100% 100%,
				color-mix(in oklab, var(--ca-brand-light) 26%, transparent),
				transparent 60%
			),
			var(--ca-surface-base);
		color: var(--ca-text-primary);
		box-shadow: 0 0 0 1px var(--ca-outline-subtle);
		transition:
			background var(--ca-duration-slow) var(--ca-ease-standard),
			color var(--ca-duration-slow) var(--ca-ease-standard);
	}
	.stage[data-style="solid"] .stage__surface,
	.stage[data-style="flat"] .stage__surface {
		background: var(--ca-surface-base);
	}
	.stage__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-3);
		margin-bottom: var(--ca-space-4);
	}
	.stage__brand {
		display: inline-flex;
		align-items: center;
		gap: var(--ca-space-2);
		color: var(--ca-brand-text);
		font-size: var(--ca-font-size-body2);
	}
	.stage__brand strong {
		color: var(--ca-text-primary);
		font-weight: 650;
	}
	.stage__grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--ca-space-3);
	}
	.stage__grid > :global(.stage__chart),
	.stage__grid > :global(.stage__controls) {
		grid-column: 1 / -1;
	}
	@container (min-width: 600px) {
		.stage__grid {
			grid-template-columns: 1fr 1fr 1.2fr;
		}
		.stage__grid > :global(.stage__chart) {
			grid-column: 1 / 3;
		}
		.stage__grid > :global(.stage__controls) {
			grid-column: 3;
			grid-row: 1 / 3;
		}
	}
	.stage__chart-title {
		margin: 0 0 var(--ca-space-3);
		font-size: var(--ca-font-size-body2);
		font-weight: 600;
	}
	.stage__spark {
		display: block;
		inline-size: 100%;
		block-size: 64px;
		color: var(--ca-brand-main);
		overflow: visible;
	}
	.stage__spark--bars {
		block-size: 40px;
		margin-top: var(--ca-space-3);
		color: var(--ca-brand-light);
	}
	.stage__area {
		fill: currentColor;
		opacity: 0.14;
	}
	.stage__line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.stage__bar-rect {
		fill: currentColor;
		opacity: 0.8;
	}
	.stage__row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-2);
		align-items: center;
		margin-bottom: var(--ca-space-3);
	}
	.stage__row:last-child {
		margin-bottom: 0;
	}
	.stage__row--between {
		justify-content: space-between;
	}
	.stage__dock {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-3) var(--ca-space-4);
	}
	.stage__swatches {
		display: flex;
		gap: var(--ca-space-2);
	}
	/* 44px hit area on touch, painted dot stays small. */
	.swatch {
		position: relative;
		inline-size: 22px;
		block-size: 22px;
		border-radius: var(--ca-radius-pill);
		border: 0;
		background: var(--ca-brand-main);
		cursor: pointer;
		box-shadow: 0 0 0 2px var(--ca-surface-base);
	}
	.swatch::after {
		content: "";
		position: absolute;
		inset: -11px;
	}
	.swatch[aria-pressed="true"] {
		box-shadow:
			0 0 0 2px var(--ca-surface-base),
			0 0 0 4px var(--ca-brand-main);
	}
	.swatch:focus-visible {
		outline: 2px solid var(--ca-text-primary);
		outline-offset: 3px;
	}
</style>

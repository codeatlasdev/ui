<script lang="ts">
	// The hero focal point: a compact product surface made only of real @codeatlasdev/ui components.
	// It cycles presets, surface styles and the dark scope by setting attributes on its own wrapper
	// (theme islands), which is the same mechanism apps use. Nothing here is imagery.
	// Alive, but calm: numbers tick, the chart draws in, "Ship it" runs a release and toasts. Every
	// timer is skipped under prefers-reduced-motion (the e2e and visual suites run with it), so the
	// first paint and the screenshots are the static final state.
	import {
		Button,
		Chip,
		Card,
		KpiCard,
		SegmentedControl,
		StatusChip,
		SwatchGroup,
		Switch,
		Toaster,
		colorScheme,
		toast,
		type SurfaceStyle,
	} from "@codeatlasdev/ui";
	import { Activity, Boxes, Gauge, Layers, Rocket, Users } from "@lucide/svelte";
	import { onMount } from "svelte";

	const PRESETS = ["ocean", "violet", "emerald", "rose", "cyan", "amber"] as const;
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

	// ── Product state ────────────────────────────────────────────────────
	let revenue = $state(41.2);
	let teams = $state(1284);
	let autoDeploy = $state(true);
	let releasing = $state(false);
	let shipped = $state(false);
	let range = $state<"12w" | "4w">("12w");
	let drawn = $state(false);

	const series = [14, 18, 15, 22, 19, 27, 24, 31, 29, 36, 33, 41];
	const traffic = [9, 12, 8, 14, 11, 16, 13, 12, 18, 15, 20, 19];
	const shown = $derived(range === "12w" ? series : series.slice(-4));
	const shownTraffic = $derived(range === "12w" ? traffic : traffic.slice(-4));

	const status = $derived(
		releasing
			? { kind: "info" as const, label: "Releasing v2…" }
			: shipped
				? { kind: "success" as const, label: "v2 is live" }
				: autoDeploy
					? { kind: "success" as const, label: "All systems normal" }
					: { kind: "warning" as const, label: "Auto deploy paused" },
	);

	// Data graphic, drawn from the numbers. Paints on the server and without JS, and takes its
	// color from the active preset (currentColor), unlike a canvas chart that needs the client.
	function spark(data: number[], w: number, h: number) {
		const max = Math.max(...data);
		const min = Math.min(...data);
		const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
		const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
		return { line, area: `${line} L${w} ${h} L0 ${h} Z` };
	}
	const line = $derived(spark(shown, 320, 64));
	const bars = $derived.by(() => {
		const slot = 320 / shownTraffic.length;
		const w = Math.min(16, slot * 0.6);
		return shownTraffic.map((v, i) => ({ x: i * slot + (slot - w) / 2, w, h: 4 + ((v - 8) / 12) * 32 }));
	});
	const summary = $derived(
		`Revenue rising from ${shown[0]} to ${shown[shown.length - 1]} over ${shown.length} weeks`,
	);

	const fmt = new Intl.NumberFormat("en-US");

	// One beat every 2.6s: preset moves each beat, surface style every second beat, scheme every fourth.
	let beat = 0;
	function step() {
		beat += 1;
		presetIdx = (presetIdx + 1) % PRESETS.length;
		if (beat % 2 === 0) styleIdx = (styleIdx + 1) % STYLES.length;
		if (beat % 4 === 0) dark = !dark;
	}

	// Small, believable drift: revenue creeps up, teams wobble by one or two.
	function tick() {
		if (!autoDeploy || releasing) return;
		revenue = Math.round((revenue + 0.1) * 10) / 10;
		teams += Math.random() < 0.7 ? 1 : 2;
	}

	let releaseTimer: ReturnType<typeof setTimeout> | undefined;
	function ship() {
		if (releasing) return;
		releasing = true;
		shipped = false;
		const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
		const done = () => {
			releasing = false;
			shipped = true;
			toast.success("v2 is live for every Northwind team.");
		};
		// Reduced motion: no staged wait, the outcome is immediate.
		if (reduce) done();
		else releaseTimer = setTimeout(done, 1400);
	}

	onMount(() => {
		live = true;
		dark = colorScheme.isDark;
		const reduce = matchMedia("(prefers-reduced-motion: reduce)");
		let timer: ReturnType<typeof setInterval> | undefined;
		let ticker: ReturnType<typeof setInterval> | undefined;
		const sync = () => {
			if (timer) clearInterval(timer);
			if (ticker) clearInterval(ticker);
			timer = ticker = undefined;
			const play = !reduce.matches && !document.hidden;
			if (auto && play) timer = setInterval(step, 2600);
			if (play) ticker = setInterval(tick, 1800);
		};
		stopTimer = () => {
			auto = false;
			sync();
		};
		// The chart draws in once, only when motion is welcome; otherwise it is already complete.
		if (!reduce.matches) requestAnimationFrame(() => (drawn = true));
		else drawn = true;
		sync();
		document.addEventListener("visibilitychange", sync);
		reduce.addEventListener("change", sync);
		return () => {
			if (timer) clearInterval(timer);
			if (ticker) clearInterval(ticker);
			if (releaseTimer) clearTimeout(releaseTimer);
			document.removeEventListener("visibilitychange", sync);
			reduce.removeEventListener("change", sync);
		};
	});

	function pick(v: string) {
		stopTimer();
		presetIdx = PRESETS.indexOf(v as (typeof PRESETS)[number]);
	}
</script>

<div class="stage" data-preset={preset} data-style={style} data-live={live ? "" : undefined} data-drawn={drawn ? "" : undefined}>
	<!-- Theme island: [data-preset] on the wrapper, [data-theme-scope] on the descendant that repaints. -->
	<div class="stage__surface" data-theme-scope={scope}>
		<header class="stage__bar">
			<div class="stage__brand">
				<Layers size={16} aria-hidden="true" />
				<strong>Northwind</strong>
			</div>
			<StatusChip status={status.kind} label={status.label} />
		</header>

		<div class="stage__grid">
			<KpiCard title="Revenue" value={revenue.toFixed(1)} unit="k" trend={12.4} icon={Gauge} />
			<KpiCard title="Active teams" value={fmt.format(teams)} trend={4.1} icon={Users} />

			<Card material="glass" elevation={4} class="stage__chart">
				<div class="stage__chart-head">
					<p class="stage__chart-title">Weekly growth</p>
					<SegmentedControl
						size="sm"
						aria-label="Chart range"
						bind:value={range}
						items={[
							{ value: "12w", label: "12 weeks" },
							{ value: "4w", label: "4 weeks" },
						]}
					/>
				</div>
				<svg class="stage__spark" viewBox="0 0 320 64" preserveAspectRatio="none" role="img" aria-label={summary}>
					<path d={line.area} class="stage__area" />
					<path d={line.line} class="stage__line" pathLength="1" vector-effect="non-scaling-stroke" />
				</svg>
				<svg class="stage__spark stage__spark--bars" viewBox="0 0 320 40" preserveAspectRatio="none" role="img" aria-label={`Weekly traffic, ${bars.length} bars`}>
					{#each bars as b, i}
						<rect x={b.x} y={40 - b.h} width={b.w} height={b.h} rx="2" class="stage__bar-rect" style:--i={i} />
					{/each}
				</svg>
			</Card>

			<Card material="glass" class="stage__controls" title="Release">
				<div class="stage__row">
					<Chip label="v2 rollout" icon={Rocket} variant="brand" size="sm" />
					<Chip label="Beta" icon={Boxes} size="sm" />
					<Chip label={shipped ? "Live" : "Staging"} icon={Activity} variant={shipped ? "success" : "default"} size="sm" />
				</div>
				<div class="stage__row stage__row--between">
					<Switch bind:checked={autoDeploy} label="Auto deploy" />
				</div>
				<div class="stage__row">
					<Button size="sm" disabled={releasing} onclick={ship}>{releasing ? "Shipping…" : shipped ? "Ship again" : "Ship it"}</Button>
					<Button size="sm" variant="outlined" onclick={() => (range = range === "12w" ? "4w" : "12w")}>Preview</Button>
				</div>
			</Card>
		</div>
	</div>

	<div class="stage__dock" role="group" aria-label="Restyle the preview">
		<SwatchGroup aria-label="Color" size="sm" value={preset} items={PRESETS.map((p) => ({ value: p }))} onchange={pick} />
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
		<Switch
			label="Dark"
			checked={dark}
			onchange={(v) => {
				stopTimer();
				dark = v;
			}}
		/>
	</div>
</div>

<Toaster />

<style>
	.stage {
		display: grid;
		gap: var(--ca-space-4);
		min-width: 0;
	}
	/* The island repaints its own ground: surface tokens re-resolve through data-theme-scope.
	   No glow: the corner is penciled in, a diagonal hatch in the active preset's brand color that
	   fades toward the middle, like shading on grid paper. */
	.stage__surface {
		position: relative;
		padding: var(--ca-space-5);
		border-radius: var(--ca-radius-xl);
		background: var(--ca-surface-base);
		color: var(--ca-text-primary);
		box-shadow: 0 0 0 1px var(--ca-outline-subtle);
		transition:
			background var(--ca-duration-slow) var(--ca-ease-standard),
			color var(--ca-duration-slow) var(--ca-ease-standard);
	}
	.stage__surface::before {
		content: "";
		position: absolute;
		inset-block-end: 0;
		inset-inline-start: 0;
		inline-size: min(44%, 13rem);
		block-size: 5rem;
		border-end-start-radius: inherit;
		background: repeating-linear-gradient(
			135deg,
			color-mix(in oklab, var(--ca-brand-main) 55%, transparent) 0 1.5px,
			transparent 1.5px 7px
		);
		mask: linear-gradient(to top right, #000, transparent 72%);
		opacity: 0.5;
		pointer-events: none;
	}
	.stage__bar {
		position: relative;
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
		position: relative;
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
	.stage__chart-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--ca-space-2);
		margin: 0 0 var(--ca-space-3);
	}
	.stage__chart-title {
		margin: 0;
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
	/* Draw-in: the line is traced and the bars rise once the island is live. The static markup is the
	   final state, so nothing here is needed to read the chart (no JS, reduced motion, screenshots). */
	@media (prefers-reduced-motion: no-preference) {
		.stage:not([data-drawn]) .stage__line {
			stroke-dasharray: 1;
			stroke-dashoffset: 1;
		}
		.stage:not([data-drawn]) .stage__area {
			opacity: 0;
		}
		.stage:not([data-drawn]) .stage__bar-rect {
			transform: scaleY(0);
		}
		.stage__line {
			stroke-dasharray: 1;
			stroke-dashoffset: 0;
			transition: stroke-dashoffset 1.1s var(--ca-ease-decelerate);
		}
		.stage__area {
			transition: opacity 0.9s var(--ca-ease-standard) 0.5s;
		}
		.stage__bar-rect {
			transform-box: fill-box;
			transform-origin: bottom;
			transition: transform 0.6s var(--ca-ease-decelerate) calc(var(--i, 0) * 45ms);
		}
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
		gap: var(--ca-space-3) var(--ca-space-5);
	}
</style>

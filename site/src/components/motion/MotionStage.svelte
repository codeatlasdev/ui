<script lang="ts">
	import { Button, reducedMotion } from "@codeatlasdev/ui";
	import { onMount, type Snippet } from "svelte";
	import { createStage, type MotionCtx } from "./stage.svelte";

	interface Props {
		/** Accessible name of the stage (what the demo shows). */
		label: string;
		/** Autoplay loop length in ms; `ctx.cycle` increments once per loop. */
		loop?: number;
		children: Snippet<[MotionCtx]>;
	}
	let { label, loop = 3200, children }: Props = $props();

	const stage = createStage({ loop, isReduced: () => reducedMotion.value });
	const ctx = stage.ctx;
	let host = $state<HTMLElement>();

	onMount(() => {
		const stopMedia = reducedMotion.init();
		stage.setHidden(document.hidden);
		const onVisibility = () => stage.setHidden(document.hidden);
		document.addEventListener("visibilitychange", onVisibility);
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) stage.setInView(e.isIntersecting && e.intersectionRatio >= 0.5);
			},
			{ threshold: [0, 0.5, 1] }
		);
		if (host) io.observe(host);
		return () => {
			stopMedia();
			document.removeEventListener("visibilitychange", onVisibility);
			io.disconnect();
		};
	});

	// One timer, alive only while playing: out of view, hidden, paused, taken over or reduced it is gone.
	$effect(() => {
		if (!ctx.playing) return;
		const id = setInterval(() => stage.tick(), stage.loop);
		return () => clearInterval(id);
	});

</script>

<div
	class="motion-stage"
	role="group"
	aria-label={label}
	bind:this={host}
	data-playing={ctx.playing}
	data-taken={stage.taken}
	data-reduced={ctx.reduced}
	data-cycle={ctx.cycle}
>
	<!-- Only the demo itself counts as a takeover; the Pause/Replay bar below is the stage's own control. -->
	<div
		class="motion-stage__canvas"
		role="presentation"
		onpointerdown={() => ctx.takeover()}
		onkeydown={() => ctx.takeover()}
		onfocusin={() => ctx.takeover()}
	>
		{@render children(ctx)}
	</div>
	<div class="motion-stage__bar">
		{#if !ctx.reduced}
			<!-- Constant name, state in aria-pressed: pressed = autoplay is stopped. -->
			<Button size="sm" variant="ghost" aria-pressed={!ctx.playing} onclick={() => stage.toggle()}
				>Pause</Button
			>
			{#if stage.taken}
				<Button size="sm" variant="outlined" onclick={() => ctx.play()}>Replay</Button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.motion-stage {
		display: flex;
		flex-direction: column;
		gap: var(--ca-space-2);
		inline-size: 100%;
		/* Fixed height: a gallery card must not jump when controls appear. */
		min-block-size: 14rem;
		container-type: inline-size;
	}
	.motion-stage__canvas {
		display: grid;
		flex: 1;
		place-items: center;
		min-block-size: 10rem;
	}
	.motion-stage__bar {
		display: flex;
		justify-content: flex-end;
		gap: var(--ca-space-2);
		min-block-size: var(--ca-space-10);
	}
</style>

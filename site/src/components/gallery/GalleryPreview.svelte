<script lang="ts">
	import type { Component } from "svelte";
	import { onMount } from "svelte";
	import { loadDemo } from "./demo-loader";

	interface Props {
		/** `<group>/<page>/<Variant>`, relative to `src/demos`. */
		path: string;
		title: string;
	}
	let { path, title }: Props = $props();

	let host = $state<HTMLElement>();
	let Demo = $state<Component | null>(null);
	let failed = $state(false);

	// Mounted only while the card is near the viewport, and unmounted again far away: 370+ live
	// demos never exist at once (a long grid stays light), and the fixed box keeps layout still.
	onMount(() => {
		if (!host) return;
		const io = new IntersectionObserver(
			(entries) => {
				const near = entries.some((e) => e.isIntersecting);
				if (!near) {
					Demo = null;
					return;
				}
				if (Demo) return;
				loadDemo(path)
					?.then((m) => (Demo = m.default))
					.catch(() => (failed = true)) ?? (failed = true);
			},
			{ rootMargin: "300px" }
		);
		io.observe(host);
		return () => io.disconnect();
	});
</script>

<div class="preview" bind:this={host} role="group" aria-label={`${title} preview`}>
	{#if Demo}
		<Demo />
	{:else if failed}
		<span class="preview__note">Preview unavailable. Open it to see the demo.</span>
	{/if}
</div>

<style>
	.preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--ca-space-3);
		width: 100%;
		height: 100%;
		min-width: 0;
	}
	.preview__note {
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
	}
</style>

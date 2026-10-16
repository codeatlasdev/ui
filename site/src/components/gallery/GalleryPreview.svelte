<script lang="ts">
	import type { Component } from "svelte";
	import { onMount } from "svelte";

	interface Props {
		/** `<group>/<page>/<Variant>`, relative to `src/demos`. */
		path: string;
		title: string;
	}
	let { path, title }: Props = $props();

	// One lazy chunk per demo: nothing is fetched until its card nears the viewport.
	const demos = import.meta.glob<{ default: Component }>("/src/demos/**/*.svelte");

	let host = $state<HTMLElement>();
	let Demo = $state<Component | null>(null);
	let failed = $state(false);

	onMount(() => {
		const load = demos[`/src/demos/${path}.svelte`];
		if (!host || !load) {
			failed = true;
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				io.disconnect();
				load()
					.then((m) => (Demo = m.default))
					.catch(() => (failed = true));
			},
			{ rootMargin: "200px" }
		);
		io.observe(host);
		return () => io.disconnect();
	});
</script>

<div class="preview" bind:this={host} role="group" aria-label={`${title} preview`}>
	{#if Demo}
		<Demo />
	{:else if failed}
		<span class="preview__note">Preview unavailable. Open the docs link.</span>
	{/if}
</div>

<style>
	.preview {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ca-space-3);
		width: 100%;
		min-width: 0;
	}
	.preview__note {
		font-size: var(--ca-font-size-caption);
		color: var(--ca-text-secondary);
	}
</style>

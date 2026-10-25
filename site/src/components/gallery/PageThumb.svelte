<script lang="ts">
	import { onMount } from "svelte";
	import { stageUrl } from "./stage-protocol";

	interface Props {
		route: string;
		title: string;
		scheme: "light" | "dark";
	}
	let { route, title, scheme }: Props = $props();

	// The page is laid out at a real desktop width and scaled down to the card.
	const WIDTH = 1280;
	const HEIGHT = 800;

	let host = $state<HTMLElement>();
	let near = $state(false);
	let boxWidth = $state(0);
	// Cover the box: fill the width, and if the page is then shorter than the box, scale up to fill it.
	let boxHeight = $state(0);
	const scale = $derived(boxWidth > 0 ? Math.max(boxWidth / WIDTH, boxHeight / HEIGHT) : 0.2);

	// Same rule as demo previews: the iframe exists only while the card is near the viewport.
	onMount(() => {
		if (!host) return;
		const r = host.getBoundingClientRect();
		boxWidth = r.width;
		boxHeight = r.height;
		const ro = new ResizeObserver(([e]) => {
			boxWidth = e.contentRect.width;
			boxHeight = e.contentRect.height;
		});
		ro.observe(host);
		const io = new IntersectionObserver((entries) => (near = entries.some((e) => e.isIntersecting)), {
			rootMargin: "200px",
		});
		io.observe(host);
		return () => {
			ro.disconnect();
			io.disconnect();
		};
	});
</script>

<div class="thumb" bind:this={host} style="--thumb-scale:{scale}">
	{#if near}
		<!-- A picture of the page, not a second copy to tab through: inert and out of the a11y tree. -->
		<iframe
			class="thumb__frame"
			src={stageUrl(route, { scheme })}
			title={`${title} thumbnail`}
			loading="lazy"
			tabindex="-1"
			aria-hidden="true"
			inert
		></iframe>
	{/if}
</div>

<style>
	.thumb {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--ca-surface-sunken, var(--ca-surface-raised));
	}
	.thumb__frame {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		width: 1280px;
		height: 800px;
		border: 0;
		transform: scale(var(--thumb-scale));
		transform-origin: top left;
		pointer-events: none;
	}
	:global([dir="rtl"]) .thumb__frame {
		inset-inline-start: auto;
		inset-inline-end: 0;
		transform-origin: top right;
	}
</style>

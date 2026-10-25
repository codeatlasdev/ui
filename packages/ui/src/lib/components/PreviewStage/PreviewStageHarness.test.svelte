<script lang="ts">
	import PreviewStage from "./PreviewStage.svelte";

	let {
		width = $bindable("fill"),
		scheme = "inherit",
		preset,
		src,
	}: {
		width?: number | "fill";
		scheme?: "light" | "dark" | "inherit";
		preset?: string;
		src?: string;
	} = $props();
</script>

<div class="host">
	{#if src}
		<PreviewStage label="Page" {src} bind:width {scheme} {preset} height={300} />
	{:else}
		<PreviewStage label="Button demo" bind:width {scheme} {preset} height={300}>
			<button type="button" class="probe">Probe</button>
		</PreviewStage>
	{/if}
	<output data-testid="w">{width}</output>
</div>

<style>
	.host { width: 900px; }
</style>

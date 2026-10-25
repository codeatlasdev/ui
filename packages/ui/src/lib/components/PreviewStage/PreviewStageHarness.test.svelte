<script lang="ts">
	import PreviewStage from "./PreviewStage.svelte";

	let {
		width = $bindable("fill"),
		scheme = "inherit",
		preset,
		src,
		tall = false,
	}: {
		width?: number | "fill";
		scheme?: "light" | "dark" | "inherit";
		preset?: string;
		src?: string;
		tall?: boolean;
	} = $props();
</script>

<div class="host">
	{#if src}
		<PreviewStage label="Page" {src} bind:width {scheme} {preset} height={300} />
	{:else}
		<PreviewStage label="Button demo" bind:width {scheme} {preset} height={300}>
			<button type="button" class="probe">Probe</button>
			{#if tall}<div class="tall">Taller than the stage</div>{/if}
		</PreviewStage>
	{/if}
	<output data-testid="w">{width}</output>
</div>

<style>
	.host { width: 900px; }
	.tall { flex: 0 0 100%; height: 600px; }
</style>

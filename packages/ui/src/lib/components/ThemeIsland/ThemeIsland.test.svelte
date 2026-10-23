<script lang="ts">
	import ThemeIsland from "./ThemeIsland.svelte";

	let {
		preset,
		scheme,
		document: mirror,
		show = true,
	}: { preset?: string; scheme: "light" | "dark"; document?: boolean; show?: boolean } = $props();
</script>

{#if show}
	<ThemeIsland {preset} {scheme} document={mirror}>
		<h1>Landing</h1>
		<p>Ink on cream.</p>
	</ThemeIsland>
{/if}

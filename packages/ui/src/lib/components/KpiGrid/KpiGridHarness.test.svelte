<script lang="ts">
	import Grid from "../Grid/Grid.svelte";
	import KpiCard from "../KpiCard/KpiCard.svelte";
	import KpiGrid from "./KpiGrid.svelte";

	/** `recipe` renders the layout the docs used before KpiGrid existed. */
	let { count, recipe = false, width }: { count: number; recipe?: boolean; width?: string } =
		$props();
	const cards = $derived(Array.from({ length: count }, (_, i) => i));
</script>

<div style:width data-testid="host">
	{#if recipe}
		<Grid gap="3" class="recipe">
			{#each cards as i (i)}<KpiCard title={`Metric ${i + 1}`} value={i + 1} />{/each}
		</Grid>
	{:else}
		<KpiGrid>
			{#each cards as i (i)}<KpiCard title={`Metric ${i + 1}`} value={i + 1} />{/each}
		</KpiGrid>
	{/if}
</div>

<style>
	:global(.recipe) { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
</style>

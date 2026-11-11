<script lang="ts">
	import CardGrid from "./CardGrid.svelte";
	import LinkCard from "./LinkCard.svelte";

	let { minItemWidth }: { minItemWidth?: string } = $props();
</script>

<div style="width:1000px">
	<CardGrid {minItemWidth}>
		{#each ["a", "b", "c", "d", "e"] as id}
			<LinkCard title={`Card ${id}`} href={`#${id}`} />
		{/each}
	</CardGrid>
</div>

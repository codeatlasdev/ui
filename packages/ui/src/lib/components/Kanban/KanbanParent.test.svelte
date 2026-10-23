<script lang="ts">
	import Kanban, { type KanbanColumn } from "./Kanban.svelte";

	let { parent = "flex" }: { parent?: "flex" | "wrap" | "nested" | "grid" } = $props();
	type Card = { id: string; title: string };
	const columns: KanbanColumn<Card>[] = ["New", "Talking", "Won", "Lost", "Later"].map((label, i) => ({
		id: `c${i}`,
		label,
		items: [{ id: `k${i}`, title: `Card ${i}` }],
	}));
</script>

{#if parent === "wrap"}
	<div class="wrap"><Kanban class="tall" {columns} getId={(c) => c.id}>{#snippet card(c)}{c.title}{/snippet}</Kanban></div>
{:else if parent === "nested"}
	<!-- an auto-width flex wrapper that owns a height, inside a wrapping flex row -->
	<div class="wrap"><div class="inner"><Kanban {columns} getId={(c) => c.id}>{#snippet card(c)}{c.title}{/snippet}</Kanban></div></div>
{:else if parent === "grid"}
	<div class="grid"><Kanban {columns} getId={(c) => c.id}>{#snippet card(c)}{c.title}{/snippet}</Kanban></div>
{:else}
	<div class="flex"><Kanban {columns} getId={(c) => c.id}>{#snippet card(c)}{c.title}{/snippet}</Kanban></div>
{/if}

<style>
	.flex { display: flex; height: 400px; }
	.grid { display: grid; grid-template-columns: auto; height: 400px; }
	.wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
	.inner { display: flex; height: 400px; }
	.wrap :global(.tall) { height: 400px; }
</style>

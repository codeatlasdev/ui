<script lang="ts">
	import Kanban, { type KanbanColumn } from "./Kanban.svelte";
	import PageShell from "../PageShell/PageShell.svelte";

	type Card = { id: string; title: string };
	let {
		headingLevel,
		compact = undefined,
		withHeader = false,
	}: { headingLevel?: 2 | 3 | 4 | 5 | 6; compact?: boolean; withHeader?: boolean } = $props();

	const columns: KanbanColumn<Card>[] = [
		{ id: "new", label: "New", items: [{ id: "c1", title: "Ana Souza" }] },
		{ id: "won", label: "Won", items: [] },
	];
</script>

{#snippet customHead(column: KanbanColumn<Card>)}
	<span data-testid="custom-{column.id}">custom {column.label}</span>
{/snippet}

<PageShell title="Pipeline">
	<div class="frame">
		<Kanban {columns} getId={(c) => c.id} {headingLevel} {compact} label="Leads" header={withHeader ? customHead : undefined}>
			{#snippet card(item)}
				<span>{item.title}</span>
			{/snippet}
		</Kanban>
	</div>
</PageShell>

<style>
	.frame { width: 100%; height: 360px; display: flex; }
</style>

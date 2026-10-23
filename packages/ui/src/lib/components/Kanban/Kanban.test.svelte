<script lang="ts">
	import Kanban, { type KanbanColumn, type KanbanMove } from "./Kanban.svelte";

	type Card = { id: string; title: string };
	let {
		moves = [],
		loads = [],
		compact = undefined,
		canMove = true,
		drop = "container",
		more = false,
		loading = false,
		loadingMore = false,
	}: {
		moves?: KanbanMove<Card>[];
		loads?: string[];
		compact?: boolean;
		canMove?: boolean;
		drop?: "position" | "container";
		more?: boolean;
		loading?: boolean;
		loadingMore?: boolean;
	} = $props();

	let columns = $state<KanbanColumn<Card>[]>([
		{ id: "new", label: "New", color: "var(--ca-info-main)", items: [{ id: "c1", title: "Ana Souza" }, { id: "c2", title: "Bruno Lima" }, { id: "c3", title: "Carla Dias" }, ...Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, title: `Lead ${i}` }))] },
		{ id: "talk", label: "Talking", items: [{ id: "c4", title: "Diego Reis" }] },
		{ id: "won", label: "Won", items: [] },
		{ id: "lost", label: "Lost", items: [] },
		{ id: "later", label: "Later", items: [] },
	]);
	const cols = $derived(
		columns.map((c) => ({ ...c, total: c.id === "new" && more ? 42 : c.items.length, hasMore: c.id === "new" && more, loading, loadingMore: c.id === "new" && loadingMore })),
	);

	function onmove(m: KanbanMove<Card>) {
		moves.push(m);
		const from = columns.find((c) => c.id === m.from.column);
		const to = columns.find((c) => c.id === m.to.column);
		if (!from || !to) return;
		from.items = from.items.filter((c) => c.id !== m.card.id);
		to.items = [...to.items.slice(0, m.to.index), m.card, ...to.items.slice(m.to.index)];
	}
</script>

<div class="frame">
	<Kanban columns={cols} getId={(c) => c.id} {onmove} onloadmore={(id) => loads.push(id)} {canMove} {compact} {drop} label="Leads">
		{#snippet card(item, { dragging })}
			<span data-dragging={dragging ? "" : undefined}>{item.title}</span>
		{/snippet}
		{#snippet empty(column)}
			<span>Nothing in {column.label}</span>
		{/snippet}
	</Kanban>
</div>

<style>
	.frame { width: 100%; height: 480px; display: flex; }
</style>

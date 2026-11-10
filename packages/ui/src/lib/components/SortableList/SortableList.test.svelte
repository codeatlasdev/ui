<script lang="ts">
	import SortableList, { type SortableListReorder } from "./SortableList.svelte";

	type Stage = { id: string; name: string };
	let { moves = [], rollback = false }: { moves?: SortableListReorder[]; rollback?: boolean } = $props();
	let stages = $state<Stage[]>([
		{ id: "a", name: "Novo" },
		{ id: "b", name: "Em andamento" },
		{ id: "c", name: "Ganho" },
		{ id: "d", name: "Perdido" },
	]);

	function onreorder(m: SortableListReorder) {
		moves.push(m);
		if (rollback) return;
		const next = [...stages];
		const [it] = next.splice(m.from, 1);
		next.splice(m.to, 0, it);
		stages = next;
	}
</script>

<SortableList items={stages} getId={(s) => s.id} getLabel={(s) => s.name} {onreorder} label="Stages">
	{#snippet item(s, { dragging })}
		<span data-dragging={dragging ? "" : undefined}>{s.name}</span>
	{/snippet}
</SortableList>

<script lang="ts">
	import { Checkbox } from "../../index.js";
	import SimpleTable from "./Table.svelte";
	import TableGroupRow from "./TableGroupRow.svelte";
	import TableRow from "./TableRow.svelte";
	import TableSortHeader from "./TableSortHeader.svelte";

	let {
		density = "compact",
		frame = false,
		scroll = "none",
		stickyColumns = 2,
		skeleton = false,
		onactivate = () => {},
		onsort = () => {},
		sort = "none",
		selected = "r2",
		wide = false,
	}: {
		density?: "default" | "compact";
		frame?: boolean;
		scroll?: "x" | "none";
		stickyColumns?: number;
		skeleton?: boolean;
		onactivate?: (id: string) => void;
		onsort?: () => void;
		sort?: "none" | "asc" | "desc";
		selected?: string;
		wide?: boolean;
	} = $props();

	let open = $state(true);
	const rows = [
		{ id: "r1", name: "Ana Souza", stage: "New" },
		{ id: "r2", name: "Bruno Lima", stage: "New" },
		{ id: "r3", name: "Carla Dias", stage: "Won" },
	];
</script>

<div data-testid="scroller" class:wide>
	<SimpleTable {density} {frame} {scroll} {stickyColumns} headerCase="sentence" {skeleton}>
		<thead>
			<tr>
				<th scope="col"><Checkbox aria-label="Select all" /></th>
				<TableSortHeader {sort} onsort={onsort}>Name</TableSortHeader>
				<th scope="col">Stage</th>
				<th scope="col">Owner</th>
				<th scope="col">Value</th>
			</tr>
		</thead>
		<tbody>
			<TableGroupRow colspan={5} collapsible bind:open>
				{#snippet label()}New <span data-testid="count">2</span>{/snippet}
			</TableGroupRow>
			{#if open}
				{#each rows.slice(0, 2) as r (r.id)}
					<TableRow selected={selected === r.id} onactivate={() => onactivate(r.id)}>
						<td><Checkbox aria-label={`Select ${r.name}`} /></td>
						<td class="primary"><a href="#{r.id}">{r.name}</a></td>
						<td>{r.stage}</td>
						<td>Matheus</td>
						<td>R$ 1.000</td>
					</TableRow>
				{/each}
			{/if}
		</tbody>
	</SimpleTable>
</div>

<style>
	[data-testid="scroller"].wide { width: 360px; overflow-x: auto; }
</style>

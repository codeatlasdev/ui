<script lang="ts">
	import { renderComponent } from "@tanstack/svelte-table";
	import { createRawSnippet } from "svelte";
	import Button from "../Button/Button.svelte";
	import DataTable from "./DataTable.svelte";
	import DataTableColumnHeader from "./DataTableColumnHeader.svelte";
	import { createCaColumnHelper } from "./table-hook.svelte.js";

	interface Task {
		id: string;
		title: string;
		status: string;
		group: string;
	}

	let {
		groups = true,
		reorder = true,
		onReorder,
		onRowClick,
		onEdit,
		rows = 6,
		pageSize,
	}: {
		groups?: boolean;
		reorder?: boolean;
		onReorder?: (e: { id: string; from: { group?: string; index: number }; to: { group?: string; index: number } }) => void;
		onRowClick?: (t: Task) => void;
		onEdit?: (t: Task) => void;
		rows?: number;
		pageSize?: number;
	} = $props();

	// svelte-ignore state_referenced_locally
	let data = $state<Task[]>(
		Array.from({ length: rows }, (_, i) => ({
			id: `t${i + 1}`,
			title: `Task ${i + 1}`,
			status: i % 2 ? "Done" : "Open",
			group: i < rows / 2 ? "Backlog" : "Sprint",
		}))
	);

	const col = createCaColumnHelper<Task>();
	const columns = col.columns([
		col.accessor("title", {
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader<Task, string>, { column, title: "Title" }),
			meta: { label: "Title", resizable: true },
			size: 240,
			minSize: 120,
			maxSize: 480,
		}),
		col.accessor("status", { header: "Status", meta: { label: "Status" } }),
		col.display({
			id: "actions",
			header: "Actions",
			cell: ({ row }) =>
				renderComponent(Button, {
					size: "sm",
					variant: "outlined",
					children: createRawSnippet(() => ({ render: () => "<span>Edit</span>" })),
					"aria-label": `Edit ${row.original.title}`,
					onclick: () => onEdit?.(row.original),
				}),
		}),
	]);

	function move(e: { id: string; from: { group?: string; index: number }; to: { group?: string; index: number } }) {
		onReorder?.(e);
		const item = data.find((t) => t.id === e.id);
		if (!item) return;
		const rest = data.filter((t) => t.id !== e.id);
		const toGroup = e.to.group ?? item.group;
		const inGroup = rest.filter((t) => t.group === toGroup);
		const before = inGroup[e.to.index];
		item.group = toGroup;
		const at = before ? rest.indexOf(before) : rest.length;
		rest.splice(at, 0, item);
		data = rest;
	}
</script>

<DataTable
	{columns}
	{data}
	{onRowClick}
	rowId={(t) => t.id}
	groupBy={groups ? (t) => t.group : undefined}
	onReorder={reorder ? move : undefined}
	pageSize={pageSize}
	searchPlaceholder="Search tasks"
/>

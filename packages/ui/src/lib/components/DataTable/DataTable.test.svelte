<script lang="ts">
	import { renderComponent } from "@tanstack/svelte-table";
	import DataTable from "./DataTable.svelte";
	import DataTableColumnHeader from "./DataTableColumnHeader.svelte";
	import { createCaColumnHelper } from "./table-hook.svelte.js";

	interface User {
		id: number;
		name: string;
		role: string;
	}

	let { onRowClick }: { onRowClick?: (u: User) => void } = $props();

	const names = [
		"Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe",
		"Gabriela", "Henrique", "Isabela", "Joao", "Karina", "Lucas",
	];
	const data: User[] = names.map((name, i) => ({
		id: i + 1,
		name,
		role: i % 2 ? "Developer" : "Admin",
	}));

	const col = createCaColumnHelper<User>();
	const columns = col.columns([
		col.accessor("name", {
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader<User, string>, { column, title: "Name" }),
			meta: { label: "Name" },
		}),
		col.accessor("role", { header: "Role", meta: { label: "Role" } }),
	]);
</script>

<DataTable {columns} {data} {onRowClick} searchPlaceholder="Search users" />

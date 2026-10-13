<script lang="ts">
	import SimpleTable from "./Table.svelte";
	import UserCell from "./UserCell.svelte";

	let { responsive = "scroll", labels = true }: { responsive?: "scroll" | "cards"; labels?: boolean } = $props();
	const l = (name: string) => (labels ? name : undefined);
</script>

<SimpleTable {responsive}>
	<thead>
		<tr>
			<th scope="col">User</th>
			<th scope="col">Role</th>
			<th scope="col">Status</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td data-label={l("User")}><UserCell name="Ana Souza" email="ana@example.com" /></td>
			<td data-label={l("Role")}>Admin</td>
			<td data-label={l("Status")}>Active</td>
		</tr>
		<tr>
			<td data-label={l("User")}><UserCell name="Bruno Lima" /></td>
			<td data-label={l("Role")}>Developer</td>
			<td data-label={l("Status")}>Invited</td>
		</tr>
	</tbody>
</SimpleTable>

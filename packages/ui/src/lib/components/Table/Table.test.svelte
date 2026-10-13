<script lang="ts">
	import SimpleTable from "./Table.svelte";
	import UserCell from "./UserCell.svelte";

	let { responsive = "scroll" }: { responsive?: "scroll" | "cards" } = $props();
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
			<td data-label="User"><UserCell name="Ana Souza" email="ana@example.com" /></td>
			<td data-label="Role">Admin</td>
			<td data-label="Status">Active</td>
		</tr>
		<tr>
			<td data-label="User"><UserCell name="Bruno Lima" /></td>
			<td data-label="Role">Developer</td>
			<td data-label="Status">Invited</td>
		</tr>
	</tbody>
</SimpleTable>

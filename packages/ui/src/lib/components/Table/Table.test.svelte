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
		</tr>
	</thead>
	<tbody>
		<tr>
			<td data-label="User"><UserCell name="Ana Souza" email="ana@example.com" /></td>
			<td data-label="Role">Admin</td>
		</tr>
		<tr>
			<td data-label="User"><UserCell name="Bruno Lima" /></td>
			<td data-label="Role">Developer</td>
		</tr>
	</tbody>
</SimpleTable>

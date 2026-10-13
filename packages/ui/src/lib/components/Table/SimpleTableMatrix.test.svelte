<script lang="ts">
	import SimpleTable from "./Table.svelte";
	import UserCell from "./UserCell.svelte";

	let { responsive = "scroll" }: { responsive?: "scroll" | "cards" } = $props();

	const rows = [
		{ name: "Ana Souza", email: "ana@example.com", role: "Admin", status: "Active" },
		{ name: "Bruno Lima", email: "bruno@example.com", role: "Developer", status: "Active" },
		{ name: "Carla Dias", email: undefined, role: "Designer", status: "Invited" },
		{ name: "Diego Alves de Albuquerque Nogueira", email: "diego.alves@example.com", role: "Viewer", status: "Inactive" },
	];
</script>

<div data-testid="matrix" style="width:100vw;padding:16px;box-sizing:border-box">
	<SimpleTable {responsive}>
		<thead>
			<tr><th>User</th><th>Role</th><th>Status</th></tr>
		</thead>
		<tbody>
			{#each rows as r (r.name)}
				<tr>
					<td data-label="User"><UserCell name={r.name} email={r.email} /></td>
					<td data-label="Role">{r.role}</td>
					<td data-label="Status">{r.status}</td>
				</tr>
			{/each}
		</tbody>
	</SimpleTable>
</div>

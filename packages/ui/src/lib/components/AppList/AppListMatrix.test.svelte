<script lang="ts">
	import Button from "../Button/Button.svelte";
	import SimpleTable from "../Table/Table.svelte";
	import UserCell from "../Table/UserCell.svelte";
	import AppList from "./AppList.svelte";

	const data = [
		{ id: 1, name: "Ana Souza", email: "ana@example.com", role: "Admin" },
		{ id: 2, name: "Bruno Lima", email: "bruno@example.com", role: "Developer" },
		{ id: 3, name: "Carla Dias", email: "carla@example.com", role: "Designer" },
		{ id: 4, name: "Diego Alves", email: "diego@example.com", role: "Developer" },
		{ id: 5, name: "Elisa Rocha", email: "elisa@example.com", role: "Admin" },
		{ id: 6, name: "Fabio Costa", email: "fabio@example.com", role: "Viewer" },
	];
</script>

<div
	data-testid="matrix"
	style="display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden"
>
	<AppList title="Users" {data} searchKeys={["name", "email"]} perPage={4}>
		{#snippet actions()}
			<Button>New user</Button>
		{/snippet}
		{#snippet children(list)}
			<SimpleTable responsive="cards">
				<thead>
					<tr><th>User</th><th>Role</th></tr>
				</thead>
				<tbody>
					{#each list.rows as u (u.id)}
						<tr>
							<td data-label="User"><UserCell name={u.name} email={u.email} /></td>
							<td data-label="Role">{u.role}</td>
						</tr>
					{/each}
				</tbody>
			</SimpleTable>
		{/snippet}
	</AppList>
</div>

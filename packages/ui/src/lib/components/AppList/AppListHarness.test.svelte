<script lang="ts">
	import AppList from "./AppList.svelte";

	interface Props {
		perPage?: number;
		withEmpty?: boolean;
	}

	let { perPage = 3, withEmpty = false }: Props = $props();

	const data = [
		{ id: 1, name: "Ana", role: "Admin" },
		{ id: 2, name: "Bruno", role: "User" },
		{ id: 3, name: "Carla", role: "User" },
		{ id: 4, name: "Diego", role: "Admin" },
		{ id: 5, name: "Elisa", role: "User" },
	];
</script>

<main>
	<AppList title="Users" {data} {perPage} searchKeys={["name"]} searchPlaceholder="Search…">
		{#snippet actions()}
			<button type="button">New</button>
		{/snippet}
		{#snippet filters(list)}
			<button type="button" onclick={() => list.setFilter("role", "Admin")}>Admins only</button>
		{/snippet}
		{#snippet empty()}
			{#if withEmpty}<p>Nothing here</p>{/if}
		{/snippet}
		{#snippet children(list)}
			<ul aria-label="Results">
				{#each list.rows as u (u.id)}
					<li>{u.name}</li>
				{/each}
			</ul>
		{/snippet}
	</AppList>
</main>

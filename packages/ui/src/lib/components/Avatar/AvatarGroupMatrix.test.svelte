<script lang="ts">
	import AvatarGroup from "./AvatarGroup.svelte";

	const items = [
		{ name: "Ana Lima" },
		{ name: "Bruno Souza" },
		{ name: "Eva Rocha" },
		{ name: "Diego Alves" },
		{ name: "Iara Costa" },
		{ name: "Gabi Reis" },
	];
	const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:max-content">
	{#each sizes as size (size)}
		<AvatarGroup {items} {size} max={4} />
	{/each}
	<AvatarGroup {items} size="md" shape="rounded" max={3} />
	<AvatarGroup items={items.slice(0, 3)} size="md" />
</div>

<script lang="ts">
	import Avatar from "./Avatar.svelte";

	const sizes = ["xs", "sm", "md", "lg", "xl", 80] as const;
	const statuses = ["online", "offline", "busy", "away"] as const;
	const names = ["Ana Lima", "Bruno Souza", "Carla", "Diego Alves Pereira", "Eva Rocha", "Fabio Dias"];
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:max-content">
	<div style="display:flex;gap:12px;align-items:center">
		{#each sizes as size (size)}
			<Avatar alt="Ana Lima" {size} />
		{/each}
	</div>
	<div style="display:flex;gap:12px;align-items:center">
		{#each sizes as size (size)}
			<Avatar alt="Ana Lima" {size} shape="rounded" />
		{/each}
	</div>
	<div style="display:flex;gap:12px;align-items:center">
		{#each statuses as status (status)}
			<Avatar alt="Ana Lima" size="lg" {status} />
		{/each}
		{#each statuses as status (status)}
			<Avatar alt="Bruno Souza" size="lg" shape="rounded" {status} />
		{/each}
	</div>
	<div style="display:flex;gap:12px;align-items:center">
		{#each names as name (name)}
			<Avatar alt={name} size="lg" />
		{/each}
		<Avatar size="lg" />
		<Avatar alt="Ignored" fallback="XY" size="lg" />
	</div>
</div>

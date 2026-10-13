<script lang="ts">
	import CopyButton from "./CopyButton.svelte";

	const variants = ["filled", "glass", "outlined", "ghost"] as const;
	const sizes = ["sm", "md", "lg"] as const;
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:max-content;grid-template-columns:repeat(4,max-content)"
>
	{#each variants as variant}
		{#each sizes as size}
			<CopyButton value="text" {variant} {size} />
		{/each}
		<CopyButton value="text" {variant} label="" />
	{/each}
	<CopyButton value="text" label="Copy code" />
</div>

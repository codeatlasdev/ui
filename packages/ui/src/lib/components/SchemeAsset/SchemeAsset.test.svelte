<script lang="ts">
	import SchemeAsset from "./SchemeAsset.svelte";

	let { scope }: { scope?: "light" | "dark" } = $props();
</script>

<div data-theme-scope={scope}>
	<SchemeAsset>
		{#snippet light()}<svg data-testid="light" width="14" height="14" viewBox="0 0 10 10" role="img" aria-label="Logo"><rect width="10" height="10" fill="#d97757" /></svg>{/snippet}
		{#snippet dark()}<svg data-testid="dark" width="14" height="14" viewBox="0 0 10 10" role="img" aria-label="Logo"><rect width="10" height="10" fill="#faf9f5" /></svg>{/snippet}
	</SchemeAsset>
</div>

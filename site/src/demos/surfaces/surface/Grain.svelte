<script lang="ts">
	import { Surface } from "@codeatlasdev/ui";
</script>

<div class="row">
	<Surface material="solid" elevation={2} grain p="4" class="tile"><p class="name">grain</p></Surface>
	<Surface material="solid" elevation={2} grain="animated" p="4" class="tile"><p class="name">grain="animated"</p></Surface>
	<Surface material="solid" elevation={2} p="4" class="tile"><p class="name">no grain</p></Surface>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--ca-space-3);
		width: 100%;
	}
	.row :global(.tile) {
		flex: 1;
		min-width: 9rem;
	}
	.name {
		margin: 0;
		font-size: var(--ca-font-size-body2);
		color: var(--ca-text-primary);
	}
</style>

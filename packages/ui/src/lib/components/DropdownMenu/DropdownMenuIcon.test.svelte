<script lang="ts">
	import SchemeAsset from "../SchemeAsset/SchemeAsset.svelte";
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
</script>

<DropdownMenu>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuItem>
		{#snippet icon()}<svg data-testid="plain" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="5" /></svg>{/snippet}
		Edit
	</DropdownMenuItem>
	<DropdownMenuItem brandIcon>
		{#snippet icon()}
			<SchemeAsset>
				{#snippet light()}<svg data-testid="brand-light" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d97757" /></svg>{/snippet}
				{#snippet dark()}<svg data-testid="brand-dark" viewBox="0 0 10 10"><rect width="10" height="10" fill="#faf9f5" /></svg>{/snippet}
			</SchemeAsset>
		{/snippet}
		Claude Code
	</DropdownMenuItem>
	<DropdownMenuItem variant="destructive" brandIcon disabled>
		{#snippet icon()}<svg data-testid="brand-destructive" viewBox="0 0 10 10"><rect width="10" height="10" fill="#d97757" /></svg>{/snippet}
		Remove
	</DropdownMenuItem>
</DropdownMenu>

<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
</script>

<DropdownMenu>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuItem data-testid="sign-out" id="sign-out-item" aria-keyshortcuts="Shift+Q" title="Leave">Sign out</DropdownMenuItem>
</DropdownMenu>

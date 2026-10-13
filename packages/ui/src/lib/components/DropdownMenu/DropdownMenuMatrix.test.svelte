<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
	import DropdownMenuLabel from "./DropdownMenuLabel.svelte";
	import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";
</script>

<div data-testid="matrix" style="padding:24px">
	<DropdownMenu>
		{#snippet trigger()}Options{/snippet}
		<DropdownMenuLabel>Account</DropdownMenuLabel>
		<DropdownMenuItem>Profile</DropdownMenuItem>
		<DropdownMenuItem disabled>Billing</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
	</DropdownMenu>
</div>

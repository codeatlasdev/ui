<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
	import DropdownMenuLabel from "./DropdownMenuLabel.svelte";
	import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";

	interface Props {
		onedit?: () => void;
		ondelete?: () => void;
	}
	let { onedit, ondelete }: Props = $props();
</script>

<DropdownMenu>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuLabel>Item</DropdownMenuLabel>
	<DropdownMenuItem onclick={onedit}>Edit</DropdownMenuItem>
	<DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
	<DropdownMenuSeparator />
	<DropdownMenuItem variant="destructive" onclick={ondelete}>Delete</DropdownMenuItem>
</DropdownMenu>

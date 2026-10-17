<script lang="ts">
	import Dialog from "../Dialog/Dialog.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
	}
	let { onOpenChange }: Props = $props();
	let open = $state(false);
</script>

<!-- A shortcut opens the dialog while the menu is open (no pointer press, so the menu is not dismissed). -->
<svelte:window
	onkeydown={(e) => {
		if (e.key === "d" && e.altKey) open = true;
	}}
/>
<DropdownMenu>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuItem>Rename</DropdownMenuItem>
</DropdownMenu>
<Dialog bind:open title="Settings" description="Opened over a menu." {onOpenChange}>
	<p>Body</p>
</Dialog>

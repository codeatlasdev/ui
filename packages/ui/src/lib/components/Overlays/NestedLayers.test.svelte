<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
	}
	let { onOpenChange }: Props = $props();
	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open dialog</Button>
<Dialog bind:open title="Settings" description="Nested layers." {onOpenChange}>
	<DropdownMenu>
		{#snippet trigger()}Actions{/snippet}
		<DropdownMenuItem>Rename</DropdownMenuItem>
		<DropdownMenuItem>Delete</DropdownMenuItem>
	</DropdownMenu>
	<Tooltip content="Helpful hint" delay={0}>Hint</Tooltip>
</Dialog>

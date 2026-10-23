<script lang="ts">
	import DropdownMenuCheckboxItem from "../DropdownMenu/DropdownMenuCheckboxItem.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import DropdownMenuSeparator from "../DropdownMenu/DropdownMenuSeparator.svelte";
	import DropdownMenuSub from "../DropdownMenu/DropdownMenuSub.svelte";
	import DropdownMenuSubTrigger from "../DropdownMenu/DropdownMenuSubTrigger.svelte";
	import ContextMenu from "./ContextMenu.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
		onrename?: () => void;
		disabled?: boolean;
		longPressDelay?: number;
		open?: boolean;
	}
	let { onOpenChange, onrename, disabled = false, longPressDelay, open = $bindable(false) }: Props = $props();
	let checked = $state(false);
</script>

<ContextMenu bind:open {onOpenChange} {disabled} {longPressDelay} aria-label="Explorer" data-testid="area" class="area">
	<span>Right-click me</span>
	<input data-testid="field" aria-label="Name" value="draft" />
	{#snippet menu()}
		<DropdownMenuItem onclick={onrename}>Rename</DropdownMenuItem>
		<DropdownMenuCheckboxItem bind:checked>Pinned</DropdownMenuCheckboxItem>
		<DropdownMenuSub>
			{#snippet trigger()}<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>{/snippet}
			<DropdownMenuItem>Archive</DropdownMenuItem>
		</DropdownMenuSub>
		<DropdownMenuSeparator />
		<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
	{/snippet}
</ContextMenu>
<button type="button">After</button>
<output data-testid="pinned">{checked}</output>
<output data-testid="open">{open}</output>

<style>
	:global(.area) { inline-size: 300px; block-size: 200px; margin: 40px; }
</style>

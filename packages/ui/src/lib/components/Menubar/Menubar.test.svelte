<script lang="ts">
	import DropdownMenuCheckboxItem from "../DropdownMenu/DropdownMenuCheckboxItem.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import DropdownMenuSeparator from "../DropdownMenu/DropdownMenuSeparator.svelte";
	import DropdownMenuSub from "../DropdownMenu/DropdownMenuSub.svelte";
	import DropdownMenuSubTrigger from "../DropdownMenu/DropdownMenuSubTrigger.svelte";
	import Menubar from "./Menubar.svelte";
	import MenubarMenu from "./MenubarMenu.svelte";

	interface Props {
		onnew?: () => void;
		onOpenChange?: (open: boolean) => void;
	}
	let { onnew, onOpenChange }: Props = $props();
	let wrap = $state(false);
</script>

<button type="button">Before</button>
<Menubar aria-label="Application" {onOpenChange}>
	<MenubarMenu label="File">
		<DropdownMenuItem onclick={onnew}>New</DropdownMenuItem>
		<DropdownMenuSub>
			{#snippet trigger()}<DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>{/snippet}
			<DropdownMenuItem>Email</DropdownMenuItem>
		</DropdownMenuSub>
		<DropdownMenuSeparator />
		<DropdownMenuItem>Print</DropdownMenuItem>
	</MenubarMenu>
	<MenubarMenu label="Edit">
		<DropdownMenuItem>Undo</DropdownMenuItem>
		<DropdownMenuItem>Redo</DropdownMenuItem>
	</MenubarMenu>
	<MenubarMenu label="Locked" disabled>
		<DropdownMenuItem>Hidden</DropdownMenuItem>
	</MenubarMenu>
	<MenubarMenu label="View">
		<DropdownMenuCheckboxItem bind:checked={wrap}>Word wrap</DropdownMenuCheckboxItem>
	</MenubarMenu>
</Menubar>
<button type="button">After</button>
<output data-testid="wrap">{wrap}</output>

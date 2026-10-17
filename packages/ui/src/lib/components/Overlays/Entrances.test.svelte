<script lang="ts">
	import Button from "../Button/Button.svelte";
	import CommandPalette from "../CommandPalette/CommandPalette.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import Drawer from "../Drawer/Drawer.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import Popover from "../Popover/Popover.svelte";
	import Sheet from "../Sheet/Sheet.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";
	import Toaster from "../Toast/Toaster.svelte";

	let { only }: { only: string } = $props();
</script>

<Button>Hover me</Button>
{#if only === "Dialog"}<Dialog open title="T">body</Dialog>{/if}
{#if only === "Drawer"}<Drawer open title="T">body</Drawer>{/if}
{#if only === "Sheet"}<Sheet open title="T">body</Sheet>{/if}
{#if only === "CommandPalette"}<CommandPalette open modules={[]} onNavigate={() => {}} />{/if}
{#if only === "DropdownMenu"}
	<DropdownMenu>
		{#snippet trigger()}Actions{/snippet}
		<DropdownMenuItem>Edit</DropdownMenuItem>
	</DropdownMenu>
{/if}
{#if only === "Popover"}
	<Popover>
		{#snippet trigger()}Details{/snippet}
		<p>content</p>
	</Popover>
{/if}
{#if only === "Tooltip"}<Tooltip content="Tip" delay={0}>Hint</Tooltip>{/if}
{#if only === "Toast"}<Toaster />{/if}

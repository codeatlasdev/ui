<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import Drawer from "../Drawer/Drawer.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import Popover from "../Popover/Popover.svelte";
	import Sheet from "../Sheet/Sheet.svelte";
	import Toaster from "../Toast/Toaster.svelte";

	let dialog = $state(true);
	let drawer = $state(true);
	let sheet = $state(true);
	let popover = $state(true);
	let menu = $state(true);
	let pageClicks = $state(0);
</script>

<button type="button" data-testid="page-button" onclick={() => pageClicks++}>Page button</button>
<output data-testid="page-clicks">{pageClicks}</output>

<div data-testid="island" data-preset="violet" class="island">
	<Dialog inline bind:open={dialog} title="Inline dialog">Dialog body</Dialog>
	<Drawer inline bind:open={drawer} title="Inline drawer">Drawer body</Drawer>
	<Sheet inline bind:open={sheet} title="Inline sheet">Sheet body</Sheet>
	<Popover inline bind:open={popover}>
		{#snippet trigger()}Popover trigger{/snippet}
		<p>Popover body</p>
	</Popover>
	<DropdownMenu inline bind:open={menu}>
		{#snippet trigger()}Menu trigger{/snippet}
		<DropdownMenuItem>Menu item</DropdownMenuItem>
	</DropdownMenu>
	<Toaster inline />
	<Button>Island button</Button>
</div>

<style>
	.island {
		position: relative;
		width: 900px;
		height: 700px;
		overflow: hidden;
	}
</style>

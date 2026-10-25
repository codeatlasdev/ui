<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import DropdownMenu from "../DropdownMenu/DropdownMenu.svelte";
	import DropdownMenuItem from "../DropdownMenu/DropdownMenuItem.svelte";
	import DropdownMenuSub from "../DropdownMenu/DropdownMenuSub.svelte";
	import DropdownMenuSubTrigger from "../DropdownMenu/DropdownMenuSubTrigger.svelte";
	import HoverCard from "../HoverCard/HoverCard.svelte";
	import NavigationMenu from "../NavigationMenu/NavigationMenu.svelte";
	import NavigationMenuItem from "../NavigationMenu/NavigationMenuItem.svelte";
	import NavigationMenuLink from "../NavigationMenu/NavigationMenuLink.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";
	import { layers } from "../../stores/layers.svelte.js";

	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open modal</Button>
<output data-testid="modal-open">{layers.modalOpen}</output>

<!-- Page behind the modal: hover UI that must stay shut while the modal is open. -->
<Tooltip content="Behind tip" delay={0}>Behind</Tooltip>
<HoverCard openDelay={0} closeDelay={0}>
	{#snippet triggerChild(props)}<a href="#u" {...props}>@behind</a>{/snippet}
	<strong>Behind card</strong>
</HoverCard>
<NavigationMenu aria-label="Behind nav" openDelay={0} closeDelay={0}>
	<NavigationMenuItem label="Behind products">
		<NavigationMenuLink href="#a">Behind link</NavigationMenuLink>
	</NavigationMenuItem>
</NavigationMenu>

<Dialog bind:open title="Settings">
	<Tooltip content="Inside tip" delay={0}>Inside</Tooltip>
	<DropdownMenu>
		{#snippet trigger()}Inside menu{/snippet}
		<DropdownMenuSub>
			{#snippet trigger()}
				<DropdownMenuSubTrigger>Inside sub</DropdownMenuSubTrigger>
			{/snippet}
			<DropdownMenuItem>Inside item</DropdownMenuItem>
		</DropdownMenuSub>
	</DropdownMenu>
</Dialog>

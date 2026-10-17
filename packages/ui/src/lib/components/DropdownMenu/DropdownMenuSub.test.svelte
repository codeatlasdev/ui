<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
	import DropdownMenuSub from "./DropdownMenuSub.svelte";
	import DropdownMenuSubTrigger from "./DropdownMenuSubTrigger.svelte";
	import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";

	interface Props {
		onred?: () => void;
		onrename?: () => void;
		onopen?: (open: boolean) => void;
	}
	let { onred, onrename, onopen }: Props = $props();
</script>

<DropdownMenu>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuItem onclick={onrename}>Rename</DropdownMenuItem>
	<DropdownMenuSub onOpenChange={onopen}>
		{#snippet trigger()}
			<DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>
		{/snippet}
		<DropdownMenuItem onclick={onred}>Red</DropdownMenuItem>
		<DropdownMenuItem disabled>Green</DropdownMenuItem>
		<DropdownMenuSub>
			{#snippet trigger()}
				<DropdownMenuSubTrigger>Shades</DropdownMenuSubTrigger>
			{/snippet}
			<DropdownMenuItem>Dark red</DropdownMenuItem>
			<DropdownMenuItem>Light red</DropdownMenuItem>
		</DropdownMenuSub>
	</DropdownMenuSub>
	<DropdownMenuSub disabled>
		{#snippet trigger()}
			<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
		{/snippet}
		<DropdownMenuItem>Inbox</DropdownMenuItem>
	</DropdownMenuSub>
	<DropdownMenuSeparator />
	<DropdownMenuItem>Delete</DropdownMenuItem>
</DropdownMenu>

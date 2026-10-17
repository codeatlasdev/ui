<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuCheckboxItem from "./DropdownMenuCheckboxItem.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";
	import DropdownMenuLabel from "./DropdownMenuLabel.svelte";
	import DropdownMenuRadioGroup from "./DropdownMenuRadioGroup.svelte";
	import DropdownMenuRadioItem from "./DropdownMenuRadioItem.svelte";
	import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";

	interface Props {
		showHidden?: boolean;
		sort?: string;
		onchange?: (checked: boolean) => void;
		onvalue?: (value: string) => void;
	}
	let { showHidden = $bindable(false), sort = $bindable("name"), onchange, onvalue }: Props = $props();
</script>

<DropdownMenu>
	{#snippet trigger()}View{/snippet}
	<DropdownMenuCheckboxItem bind:checked={showHidden} onCheckedChange={onchange}>Show hidden files</DropdownMenuCheckboxItem>
	<DropdownMenuCheckboxItem checked disabled>Pinned</DropdownMenuCheckboxItem>
	<DropdownMenuSeparator />
	<DropdownMenuRadioGroup bind:value={sort} onValueChange={onvalue} aria-label="Sort by">
		<DropdownMenuLabel>Sort by</DropdownMenuLabel>
		<DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
		<DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
		<DropdownMenuRadioItem value="size" disabled>Size</DropdownMenuRadioItem>
	</DropdownMenuRadioGroup>
	<DropdownMenuSeparator />
	<DropdownMenuItem>Refresh</DropdownMenuItem>
</DropdownMenu>

<output data-testid="state">{showHidden}|{sort}</output>

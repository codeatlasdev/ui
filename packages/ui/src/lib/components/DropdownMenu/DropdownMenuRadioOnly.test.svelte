<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuRadioGroup from "./DropdownMenuRadioGroup.svelte";
	import DropdownMenuRadioItem from "./DropdownMenuRadioItem.svelte";

	let value = $state("pt");
</script>

<!-- Imports no DropdownMenuItem: the item styles must come with the radio item itself (#699). -->
<DropdownMenu>
	{#snippet trigger()}Language{/snippet}
	<DropdownMenuRadioGroup bind:value aria-label="Language">
		<DropdownMenuRadioItem value="pt">Português</DropdownMenuRadioItem>
		<DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
	</DropdownMenuRadioGroup>
</DropdownMenu>

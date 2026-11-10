<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuCheckboxItem from "./DropdownMenuCheckboxItem.svelte";
</script>

<!-- Imports no DropdownMenuItem: the item styles must come with the checkbox item itself (#699). -->
<DropdownMenu>
	{#snippet trigger()}View{/snippet}
	<DropdownMenuCheckboxItem checked>Show hidden files</DropdownMenuCheckboxItem>
</DropdownMenu>

<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuItem from "./DropdownMenuItem.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
	}
	let { onOpenChange }: Props = $props();
	let open = $state(false);
</script>

<button type="button" onclick={() => (open = true)}>Open from outside</button>
<output data-testid="open">{open}</output>
<DropdownMenu bind:open {onOpenChange}>
	{#snippet trigger()}Actions{/snippet}
	<DropdownMenuItem>Edit</DropdownMenuItem>
</DropdownMenu>

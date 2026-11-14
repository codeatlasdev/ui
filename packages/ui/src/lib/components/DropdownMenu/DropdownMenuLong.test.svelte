<script lang="ts">
	import DropdownMenu from "./DropdownMenu.svelte";
	import DropdownMenuRadioGroup from "./DropdownMenuRadioGroup.svelte";
	import DropdownMenuRadioItem from "./DropdownMenuRadioItem.svelte";

	let { count = 22, value = "stage-18" }: { count?: number; value?: string } = $props();
	const stages = $derived(Array.from({ length: count }, (_, i) => `stage-${i + 1}`));
</script>

<DropdownMenu>
	{#snippet trigger()}Stage{/snippet}
	<DropdownMenuRadioGroup {value} aria-label="Stage">
		{#each stages as stage (stage)}
			<DropdownMenuRadioItem value={stage}>{stage}</DropdownMenuRadioItem>
		{/each}
	</DropdownMenuRadioGroup>
</DropdownMenu>

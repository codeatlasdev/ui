<script lang="ts">
	import Popover from "./Popover.svelte";

	interface Props {
		onOpenChange?: (open: boolean) => void;
	}
	let { onOpenChange }: Props = $props();
	let open = $state(false);
</script>

<button type="button" onclick={() => (open = true)}>Open from outside</button>
<output data-testid="open">{open}</output>
<Popover bind:open {onOpenChange}>
	{#snippet trigger()}Details{/snippet}
	{#snippet children({ close })}
		<p>Popover content</p>
		<button type="button" onclick={() => close()}>Pick</button>
	{/snippet}
</Popover>

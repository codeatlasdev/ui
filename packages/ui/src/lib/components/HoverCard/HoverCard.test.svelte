<script lang="ts">
	import HoverCard from "./HoverCard.svelte";

	interface Props {
		openDelay?: number;
		closeDelay?: number;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}
	let { openDelay = 0, closeDelay = 0, open = $bindable(false), onOpenChange }: Props = $props();
</script>

<a href="#before">Before</a>
<HoverCard bind:open {openDelay} {closeDelay} {onOpenChange}>
	{#snippet triggerChild(props)}<a href="#profile" {...props}>@ada</a>{/snippet}
	<strong>Ada Lovelace</strong>
	<a href="#follow">Follow</a>
</HoverCard>
<button type="button">After</button>

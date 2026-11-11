<script lang="ts">
	import Popover from "./Popover.svelte";

	interface Props {
		density?: "default" | "compact";
	}
	let { density }: Props = $props();
</script>

<Popover {density} open>
	{#snippet trigger()}Details{/snippet}
	<div data-testid="inner" class="ca-test-inner">Content</div>
</Popover>

<style>
	.ca-test-inner { width: 240px; height: 24px; }
</style>

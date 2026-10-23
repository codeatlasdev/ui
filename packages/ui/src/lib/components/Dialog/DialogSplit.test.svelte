<script lang="ts">
	import Dialog from "./Dialog.svelte";

	interface Props {
		size?: "sm" | "md" | "lg" | "xl" | "split";
		splitColumns?: string;
		splitSize?: { width?: string; height?: string };
		fullscreenBelow?: "sm" | "md";
	}
	let { size = "split", splitColumns, splitSize, fullscreenBelow }: Props = $props();
	let open = $state(true);
</script>

<Dialog bind:open {size} {splitColumns} {splitSize} {fullscreenBelow} title="Lead" description="Lead detail.">
	<div data-testid="map">Map</div>
	<div data-testid="details"><input aria-label="Name" /></div>
</Dialog>

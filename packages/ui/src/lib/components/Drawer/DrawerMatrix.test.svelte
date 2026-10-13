<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Drawer from "./Drawer.svelte";

	let { side = "right" }: { side?: "left" | "right" | "bottom" } = $props();
	let open = $state(false);
</script>

<div data-testid="matrix" style="padding:24px">
	<Button onclick={() => (open = true)}>Open</Button>
</div>

<Drawer bind:open {side} title="Filters">
	<p style="margin:0">Side panel content with sample filters.</p>
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (open = false)}>Clear</Button>
		<Button onclick={() => (open = false)}>Apply</Button>
	{/snippet}
</Drawer>

<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Drawer from "./Drawer.svelte";

	interface Props {
		fullBleedBelow?: "sm" | "md" | "lg";
		side?: "left" | "right" | "bottom";
		naming?: "title" | "aria-label" | "labelledby";
	}
	let { fullBleedBelow, side = "right", naming = "labelledby" }: Props = $props();
	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open detail</Button>
<Drawer
	bind:open
	{side}
	chromeless
	width="26rem"
	{fullBleedBelow}
	title={naming === "title" ? "Detail" : undefined}
	aria-label={naming === "aria-label" ? "Detail" : undefined}
	aria-labelledby={naming === "labelledby" ? "detail-title" : undefined}
	data-testid="detail-drawer"
>
	<header class="own-header">
		<h2 id="detail-title">Detail</h2>
		<Button variant="ghost" aria-label="Close detail" onclick={() => (open = false)}>x</Button>
	</header>
	<div class="own-scroll" data-testid="scroller" style="flex:1;min-height:0;overflow-y:auto">
		<div style="height:2000px">Tall content</div>
	</div>
</Drawer>

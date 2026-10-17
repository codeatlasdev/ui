<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Drawer from "./Drawer.svelte";

	interface Props {
		mode: "labelledby" | "aria-label" | "hideTitle";
	}
	let { mode }: Props = $props();
	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open item</Button>

{#if mode === "labelledby"}
	<Drawer bind:open aria-labelledby="item-heading" data-testid="item-drawer" id="item-drawer">
		<header class="own-header">
			<h2 id="item-heading">PRJ-42 Fix login</h2>
			<Button variant="ghost" aria-label="More actions">...</Button>
		</header>
		<p>Body</p>
	</Drawer>
{:else if mode === "aria-label"}
	<Drawer bind:open aria-label="Item details" data-testid="item-drawer">
		<p>Body</p>
	</Drawer>
{:else}
	<Drawer bind:open title="Item details" hideTitle data-testid="item-drawer">
		<p>Body</p>
	</Drawer>
{/if}

<script lang="ts">
	import AlertDialog from "../AlertDialog/AlertDialog.svelte";
	import Button from "../Button/Button.svelte";
	import Drawer from "../Drawer/Drawer.svelte";

	interface Props {
		onDrawerChange?: (open: boolean) => void;
	}
	let { onDrawerChange }: Props = $props();
	let drawerOpen = $state(false);
	let confirmOpen = $state(false);
</script>

<!-- Dialogs are portaled to <body>, so the token is set on :root. A long exit keeps the closing
     dialog mounted, which makes the race window deterministic. -->
<svelte:head>
	<style>
		:root {
			--ca-duration-fast: 5s;
		}
	</style>
</svelte:head>
<div>
	<Button onclick={() => (drawerOpen = true)}>Open drawer</Button>
	<Drawer bind:open={drawerOpen} title="Item A" onOpenChange={onDrawerChange}>
		<Button onclick={() => (confirmOpen = true)}>Delete</Button>
		<AlertDialog bind:open={confirmOpen} title="Delete?" description="Gone for good." onconfirm={() => {}} />
	</Drawer>
</div>

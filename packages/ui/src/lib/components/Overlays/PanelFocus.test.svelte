<script lang="ts">
	import AlertDialog from "../AlertDialog/AlertDialog.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import Drawer from "../Drawer/Drawer.svelte";
	import Sheet from "../Sheet/Sheet.svelte";

	interface Props {
		kind: "dialog" | "alert" | "drawer" | "sheet";
	}
	let { kind }: Props = $props();
	let open = $state(true);
</script>

{#if kind === "dialog"}
	<Dialog bind:open title="Contact"><input aria-label="Name" /></Dialog>
{:else if kind === "alert"}
	<AlertDialog bind:open title="Delete contact?" onconfirm={() => {}} />
{:else if kind === "drawer"}
	<Drawer bind:open title="Contact"><input aria-label="Name" /></Drawer>
{:else}
	<Sheet bind:open title="Contact"><input aria-label="Name" /></Sheet>
{/if}

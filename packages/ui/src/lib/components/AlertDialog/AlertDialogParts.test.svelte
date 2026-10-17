<script lang="ts">
	import Button from "../Button/Button.svelte";
	import TextField from "../TextField/TextField.svelte";
	import AlertDialog from "./AlertDialog.svelte";

	interface Props {
		mode: "props" | "body" | "rich";
		onconfirm?: () => void | Promise<void>;
	}
	let { mode, onconfirm = () => {} }: Props = $props();
	let open = $state(false);
	let typed = $state("");
</script>

<Button onclick={() => (open = true)}>Delete item</Button>

{#if mode === "props"}
	<AlertDialog
		bind:open
		title="Delete item?"
		confirmLabel="Delete"
		destructive
		cancelVariant="outlined"
		confirmProps={{ "data-testid": "confirm-btn", id: "confirm-id" }}
		cancelProps={{ "data-testid": "cancel-btn" }}
		{onconfirm}
	/>
{:else if mode === "rich"}
	<AlertDialog bind:open title="Delete item?" confirmLabel="Delete" {onconfirm}>
		{#snippet description()}Removes <strong>3 linked records</strong> too.{/snippet}
	</AlertDialog>
{:else}
	<AlertDialog
		bind:open
		title="Delete ITEM-1?"
		confirmLabel="Delete"
		destructive
		confirmDisabled={typed !== "ITEM-1"}
		{onconfirm}
	>
		<TextField label="Type ITEM-1 to confirm" bind:value={typed} />
	</AlertDialog>
{/if}

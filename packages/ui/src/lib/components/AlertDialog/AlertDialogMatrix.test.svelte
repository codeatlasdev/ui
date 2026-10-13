<script lang="ts">
	import Button from "../Button/Button.svelte";
	import AlertDialog from "./AlertDialog.svelte";

	let { destructive = false }: { destructive?: boolean } = $props();
	let open = $state(false);
</script>

<div data-testid="matrix" style="padding:24px">
	<Button onclick={() => (open = true)}>Open</Button>
</div>

<AlertDialog
	bind:open
	{destructive}
	title="Delete item?"
	description="This action cannot be undone."
	confirmLabel={destructive ? "Delete" : "Confirm"}
	onconfirm={() => {}}
/>

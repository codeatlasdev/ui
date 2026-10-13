<script lang="ts">
	import Button from "../Button/Button.svelte";
	import AlertDialog from "./AlertDialog.svelte";

	interface Props {
		destructive?: boolean;
		pending?: boolean;
		onconfirm?: () => void | Promise<void>;
		oncancel?: () => void;
	}
	let { destructive = false, pending = false, onconfirm = () => {}, oncancel }: Props = $props();
	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Delete item</Button>
<AlertDialog
	bind:open
	title="Delete item?"
	description="This action cannot be undone."
	confirmLabel="Delete"
	{destructive}
	{pending}
	{onconfirm}
	{oncancel}
/>

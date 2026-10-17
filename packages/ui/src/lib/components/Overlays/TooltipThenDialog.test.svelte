<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "../Dialog/Dialog.svelte";
	import Tooltip from "../Tooltip/Tooltip.svelte";

	let open = $state(false);
</script>

<!-- #324: a Tooltip on the button that opens a Dialog (Atlas Desktop "Settings ⌘,"). -->
<Tooltip content="Settings ⌘," delay={0}>
	{#snippet triggerChild(props)}
		<Button {...props} onclick={() => (open = true)}>Settings</Button>
	{/snippet}
</Tooltip>
<Dialog bind:open title="Settings" description="Opened from a button with a tooltip.">
	<p>Body</p>
</Dialog>

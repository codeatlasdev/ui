<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "./Dialog.svelte";

	let open = $state(false);
	let lost = $state(false);
	let clicks = $state(0);
</script>

<main id="main" tabindex="-1">
	{#if !lost}
		<Button id="lose" onclick={() => (open = true)}>Lose</Button>
	{:else}
		<Button id="reopen" onclick={() => clicks++}>Reopen</Button>
	{/if}
	<output data-testid="clicks">{clicks}</output>
</main>

<Dialog bind:open title="Reason" size="sm">
	{#snippet actions()}
		<Button
			onclick={() => {
				open = false;
				lost = true;
			}}>Confirm</Button
		>
	{/snippet}
</Dialog>

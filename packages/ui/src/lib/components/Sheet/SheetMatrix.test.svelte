<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Sheet from "./Sheet.svelte";

	let open = $state(false);
</script>

<div data-testid="matrix" style="padding:24px">
	<Button onclick={() => (open = true)}>Open</Button>
</div>

<Sheet bind:open title="Switch session" description="Choose the active account">
	<ul style="margin:0;padding:0;list-style:none;display:grid;gap:8px">
		<li>Personal account</li>
		<li>Team workspace</li>
		<li>Testing workspace</li>
	</ul>
	{#snippet footer()}
		<Button fullWidth>New session</Button>
	{/snippet}
</Sheet>

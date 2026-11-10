<script lang="ts">
	import Button from "../components/Button/Button.svelte";
	import Dialog from "../components/Dialog/Dialog.svelte";
	import MobilePane from "../components/MobilePane/MobilePane.svelte";
	import Sheet from "../components/Sheet/Sheet.svelte";

	let sheet = $state(false);
	let dialog = $state(false);
	let pane = $state(false);
	let quiet = $state(false);
</script>

<main>
	<Button onclick={() => (sheet = true)}>Open sheet</Button>
	<Button onclick={() => (pane = true)}>Open pane</Button>
	<Button onclick={() => (quiet = true)}>Open quiet</Button>
	<output data-testid="state">{JSON.stringify({ sheet, dialog, pane, quiet })}</output>
</main>

<Sheet bind:open={sheet} title="Filters">
	<Button onclick={() => (dialog = true)}>Open dialog</Button>
	<a href="#inside">Inside link</a>
</Sheet>
<Dialog bind:open={dialog} title="Nested">
	<p>Nested body</p>
</Dialog>
<MobilePane bind:open={pane} title="Thread">
	<p>Thread body</p>
</MobilePane>
<Dialog bind:open={quiet} title="Quiet" history={false}>
	<p>No history entry</p>
</Dialog>

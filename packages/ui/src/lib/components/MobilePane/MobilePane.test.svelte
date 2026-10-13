<script lang="ts">
	import Button from "../Button/Button.svelte";
	import MobilePane from "./MobilePane.svelte";

	interface Props {
		onback?: () => void;
	}
	let { onback }: Props = $props();
	let open = $state(false);
</script>

<main>
<Button onclick={() => (open = true)}>Open pane</Button>
</main>
<MobilePane bind:open title="Conversation" {onback}>
	<input aria-label="Message" />
	{#snippet actions()}
		<Button size="sm">Action</Button>
	{/snippet}
</MobilePane>

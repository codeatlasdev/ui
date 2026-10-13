<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Sheet from "./Sheet.svelte";

	interface Props {
		title?: string;
		description?: string;
		onclose?: () => void;
		swipeToDismiss?: boolean;
	}
	let { title = "Switch session", description = "Choose the active account", onclose, swipeToDismiss = true }: Props = $props();
	let open = $state(false);
</script>

<Button onclick={() => (open = true)}>Open sheet</Button>
<Sheet bind:open {title} {description} {onclose} {swipeToDismiss}>
	<ul>
		<li><button type="button">Account A</button></li>
		<li><button type="button">Account B</button></li>
	</ul>
	{#snippet footer()}
		<Button>New session</Button>
	{/snippet}
</Sheet>

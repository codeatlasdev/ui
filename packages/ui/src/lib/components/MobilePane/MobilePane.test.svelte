<script lang="ts">
	import Button from "../Button/Button.svelte";
	import MobilePane from "./MobilePane.svelte";

	interface Props {
		onback?: () => void;
		title?: string;
		richTitle?: boolean;
	}
	let { onback, title = "Conversation", richTitle = false }: Props = $props();
	let open = $state(false);
</script>

<main>
<Button onclick={() => (open = true)}>Open pane</Button>
</main>
{#snippet rich()}
	<span class="rich"><span class="avatar"></span><span class="rich-name">{title}</span></span>
{/snippet}
<MobilePane bind:open {title} {onback} headerTitle={richTitle ? rich : undefined}>
	<input aria-label="Message" />
	{#snippet actions()}
		<Button size="sm">Action</Button>
	{/snippet}
</MobilePane>

<style>
	.rich { display: flex; align-items: center; gap: 8px; }
	.avatar { flex: none; width: 32px; height: 32px; border-radius: 50%; background: currentColor; }
	.rich-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

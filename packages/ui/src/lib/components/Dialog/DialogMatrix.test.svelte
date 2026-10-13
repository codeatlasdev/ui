<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Dialog from "./Dialog.svelte";

	interface Props {
		size?: "sm" | "md" | "lg" | "xl" | "split";
		chromeless?: boolean;
		/** Opens on mount (used by the responsive split screenshots). */
		open?: boolean;
	}

	let { size = "md", chromeless = false, open = $bindable(false) }: Props = $props();
</script>

<div data-testid="matrix" style="padding:24px">
	<Button onclick={() => (open = true)}>Open</Button>
</div>

<Dialog
	bind:open
	{size}
	{chromeless}
	title="Invite member"
	description="Send an email invitation to the workspace."
>
	{#if size === "split"}
		<div style="padding:24px">
			<h3 style="margin:0 0 8px">Details</h3>
			<p style="margin:0">Left column with the invitation details.</p>
		</div>
		<div style="padding:24px;background:var(--ca-surface-base)">
			<h3 style="margin:0 0 8px">Preview</h3>
			<p style="margin:0">Right column with the summary.</p>
		</div>
	{:else if chromeless}
		<div style="padding:24px">
			<p style="margin:0">Content without header or actions.</p>
		</div>
	{:else}
		<p style="margin:0">Dialog content with sample text to measure spacing.</p>
	{/if}
	{#snippet actions()}
		<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
		<Button onclick={() => (open = false)}>Invite</Button>
	{/snippet}
</Dialog>

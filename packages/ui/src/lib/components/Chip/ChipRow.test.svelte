<script lang="ts">
	import Chip from "./Chip.svelte";
	import ChipRow from "./ChipRow.svelte";

	let { raw = false, wrap = false, fade = false }: { raw?: boolean; wrap?: boolean; fade?: boolean } = $props();
	const labels = ["All", "Unread", "Groups", "Archived", "Starred", "Muted", "Mentions", "Drafts", "Sent", "Spam"];
</script>

<div style="width:300px;padding:12px 0">
	{#if raw}
		<!-- The pattern consumers hand-wrote: a bare scroller, which clips the overhanging hit area. -->
		<div data-testid="raw" style="display:flex;gap:6px;overflow-x:auto">
			{#each labels as l (l)}<Chip label={l} onclick={() => {}} />{/each}
		</div>
	{:else}
		<ChipRow label="Filter chats" {wrap} {fade}>
			{#each labels as l (l)}<Chip label={l} onclick={() => {}} />{/each}
		</ChipRow>
	{/if}
</div>

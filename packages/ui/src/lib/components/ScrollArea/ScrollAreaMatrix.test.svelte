<script lang="ts">
	import ScrollArea from "./ScrollArea.svelte";

	const rows = Array.from({ length: 20 }, (_, i) => `Row ${i + 1}`);
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(3,220px);gap:16px;padding:16px;width:max-content"
>
	<ScrollArea type="always" maxHeight="160px">
		{#snippet children()}
			{#each rows as r (r)}<div style="padding:4px 8px">{r}</div>{/each}
		{/snippet}
	</ScrollArea>
	<ScrollArea type="always" orientation="horizontal" maxWidth="220px">
		{#snippet children()}
			<div style="width:600px;padding:8px;white-space:nowrap">
				Wide content that exceeds the maximum width and requires horizontal scrolling to be read in full.
			</div>
		{/snippet}
	</ScrollArea>
	<ScrollArea type="always" orientation="both" maxHeight="160px" maxWidth="220px">
		{#snippet children()}
			<div style="width:500px">
				{#each rows as r (r)}<div style="padding:4px 8px;white-space:nowrap">{r}: wide text for two-axis scrolling</div>{/each}
			</div>
		{/snippet}
	</ScrollArea>
	<ScrollArea type="hover" maxHeight="160px">
		{#snippet children()}
			{#each rows as r (r)}<div style="padding:4px 8px">{r}</div>{/each}
		{/snippet}
	</ScrollArea>
	<ScrollArea type="auto" maxHeight="160px">
		{#snippet children()}
			<div style="padding:8px">Short content, no overflow.</div>
		{/snippet}
	</ScrollArea>
</div>

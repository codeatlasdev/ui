<script lang="ts">
	import Callout from "./Callout.svelte";

	const types = ["note", "tip", "caution", "danger"] as const;
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(2,420px);gap:16px;padding:16px;width:max-content"
>
	{#each types as type (type)}
		<Callout {type}>
			{#snippet children()}<p>Callout content {type}.</p>{/snippet}
		</Callout>
		<Callout {type} title="Custom title">
			{#snippet children()}<p>First paragraph.</p><p>Second paragraph with <code>code</code>.</p>{/snippet}
		</Callout>
	{/each}
</div>

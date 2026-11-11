<script lang="ts">
	import PageShell from "./PageShell.svelte";

	let { scroll, inset }: { scroll?: boolean; inset?: string } = $props();
	const rows = Array.from({ length: 60 }, (_, i) => i);
</script>

<div data-testid="host" style={inset ? `--ca-shell-inset-bottom:${inset}` : undefined}>
	<PageShell title="Records" {scroll}>
		{#each rows as r (r)}<p style="margin:0;height:40px">Row {r}</p>{/each}
	</PageShell>
</div>

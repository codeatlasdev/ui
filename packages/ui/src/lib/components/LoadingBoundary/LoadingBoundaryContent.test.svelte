<script lang="ts">
	let { promise }: { promise: Promise<string> } = $props();
	const value = $derived(await promise);
</script>

<p data-testid="content">{value}</p>

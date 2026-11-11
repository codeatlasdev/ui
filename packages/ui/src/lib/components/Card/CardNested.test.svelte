<script lang="ts">
	import Card from "./Card.svelte";

	let { padding }: { padding?: "none" | "sm" | "md" | "lg" } = $props();
</script>

<Card {padding} data-testid="outer">
	<Card data-testid="inner"><p>Inner</p></Card>
</Card>
<Card data-testid="alone"><p>Alone</p></Card>

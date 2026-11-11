<script lang="ts">
	import { untrack } from "svelte";
	import Rating from "./Rating.svelte";

	let { initial = 0, ...rest }: { initial?: number; [k: string]: unknown } = $props();
	let value = $state(untrack(() => initial));
</script>

<form data-testid="form"><Rating label="Service" name="score" bind:value {...rest} /></form>
<output data-testid="bound">{value}</output>

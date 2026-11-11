<script lang="ts">
	import { untrack } from "svelte";
	import Toggle from "./Toggle.svelte";

	let {
		initial = false,
		...rest
	}: { initial?: boolean; [key: string]: unknown } = $props();
	let pressed = $state(untrack(() => initial));
</script>

<Toggle bind:pressed {...rest} />
<output data-testid="bound">{pressed ? "on" : "off"}</output>

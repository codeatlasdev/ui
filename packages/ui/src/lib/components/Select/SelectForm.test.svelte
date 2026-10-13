<script lang="ts">
	import Select from "./Select.svelte";
	let { onsubmit }: { onsubmit: () => void } = $props();
	let value = $state("");
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		onsubmit();
	}}
>
	<Select label="Plan" required bind:value options={[{ value: "pro", label: "Pro" }]} />
	<button type="submit">Send</button>
</form>

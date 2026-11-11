<script lang="ts">
	import Select from "../Select/Select.svelte";
	import NumberField from "./NumberField.svelte";

	let { amount = 5 }: { amount?: number } = $props();
	let unit = $state("m");
</script>

<NumberField label="Wait" description="Before the next step" value={amount}>
	{#snippet suffix()}
		<Select
			hideLabel
			label="Unit"
			bind:value={unit}
			options={[
				{ value: "s", label: "Seconds" },
				{ value: "m", label: "Minutes" },
			]}
		/>
	{/snippet}
</NumberField>

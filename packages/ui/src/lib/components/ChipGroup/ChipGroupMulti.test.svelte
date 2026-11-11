<script lang="ts">
	import ChipGroup from "./ChipGroup.svelte";

	let { onchange }: { onchange?: (v: string[]) => void } = $props();
	let value = $state<string[]>(["b"]);
</script>

<form data-testid="form">
	<ChipGroup
		multiple
		label="Specialties"
		name="spec"
		bind:value
		{onchange}
		items={[
			{ value: "a", label: "Dentists" },
			{ value: "b", label: "Lawyers" },
			{ value: "c", label: "Doctors", disabled: true },
		]}
	/>
</form>
<output data-testid="bound">{value.join(",")}</output>

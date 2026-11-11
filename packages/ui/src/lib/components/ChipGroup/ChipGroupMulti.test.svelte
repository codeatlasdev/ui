<script lang="ts">
	import { untrack } from "svelte";
	import ChipGroup from "./ChipGroup.svelte";

	let {
		onchange,
		initial = ["b"],
		...rest
	}: { onchange?: (v: string[]) => void; initial?: string[]; [key: string]: unknown } = $props();
	let value = $state<string[]>(untrack(() => initial));
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
		{...rest}
	/>
</form>
<output data-testid="bound">{value.join(",")}</output>

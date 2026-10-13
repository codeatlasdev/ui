<script lang="ts">
	import Select from "./Select.svelte";

	const options = [
		{ value: "a", label: "Alpha" },
		{ value: "b", label: "Beta" },
		{ value: "c", label: "Gamma", disabled: true },
		{ value: "d", label: "Delta" },
	];
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<Select label="Placeholder" {options} placeholder="Choose an option" />
	<Select label="Selected" {options} value="b" />
	<Select label="Small" size="sm" {options} value="a" />
	<Select label="Description" description="Help text" {options} value="a" />
	<Select label="Error" error="Invalid selection" {options} />
	<Select label="Required" required {options} placeholder="Choose an option" />
	<Select label="Disabled" disabled {options} value="a" />
	<Select
		label="Long label"
		options={[{ value: "x", label: "An option with an extremely long label to test truncation" }]}
		value="x"
	/>
</div>

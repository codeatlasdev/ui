<script lang="ts">
	import Combobox from "./Combobox.svelte";

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
	<Combobox label="Placeholder" {options} placeholder="Choose an option" />
	<Combobox label="Selected" {options} value="b" />
	<Combobox label="Small" size="sm" {options} value="a" />
	<Combobox label="Description" description="Help text" {options} value="a" />
	<Combobox label="Error" error="Invalid selection" {options} />
	<Combobox label="Required" required {options} placeholder="Choose an option" />
	<Combobox label="Disabled" disabled {options} value="a" />
	<Combobox
		label="Long label"
		options={[{ value: "x", label: "An option with an extremely long label to test truncation" }]}
		value="x"
	/>
</div>

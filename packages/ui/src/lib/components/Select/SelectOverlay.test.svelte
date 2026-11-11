<script lang="ts">
	import Select from "./Select.svelte";
</script>

<Select
	label="Open"
	value="b"
	options={[
		{ value: "a", label: "Alpha", group: "Greek" },
		{ value: "b", label: "Beta", group: "Greek" },
		{ value: "c", label: "Gamma", disabled: true, group: "Greek" },
		{ value: "d", label: "Delta", group: "More" },
		{ value: "e", label: "Ungrouped" },
	]}
/>

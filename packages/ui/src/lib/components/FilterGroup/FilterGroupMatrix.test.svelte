<script lang="ts">
	import FilterGroup from "./FilterGroup.svelte";

	const options = [
		{ value: "all", label: "All" },
		{ value: "admin", label: "Admin" },
		{ value: "editor", label: "Editor" },
		{ value: "viewer", label: "Viewer" },
	];
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:720px">
	<FilterGroup label="Role" {options} />
	<FilterGroup label="Role" {options} value="editor" />
	<FilterGroup {options} value="admin" />
	<FilterGroup
		label="Status"
		options={[
			{ value: "a", label: "Awaiting approval" },
			{ value: "b", label: "In progress" },
			{ value: "c", label: "Completed successfully" },
			{ value: "d", label: "Canceled by user" },
			{ value: "e", label: "Archived" },
		]}
		value="c"
	/>
</div>

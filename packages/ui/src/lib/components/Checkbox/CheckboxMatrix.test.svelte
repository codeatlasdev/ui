<script lang="ts">
	import Checkbox from "./Checkbox.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:max-content;grid-template-columns:repeat(2,max-content)"
>
	<Checkbox label="Unchecked" />
	<Checkbox label="Checked" checked />
	<Checkbox label="Indeterminate" indeterminate />
	<Checkbox label="Disabled" disabled />
	<Checkbox label="Checked disabled" checked disabled />
	<Checkbox label="Indeterminate disabled" indeterminate disabled />
	<Checkbox label="A fairly long label to check alignment with the box" checked />
	<Checkbox checked />
</div>

<script lang="ts">
	import Switch from "./Switch.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:max-content;grid-template-columns:repeat(2,max-content)"
>
	<Switch label="Off" />
	<Switch label="On" checked />
	<Switch label="Disabled" disabled />
	<Switch label="On disabled" checked disabled />
	<Switch label="A fairly long label to check alignment with the control" checked />
	<Switch checked />
</div>

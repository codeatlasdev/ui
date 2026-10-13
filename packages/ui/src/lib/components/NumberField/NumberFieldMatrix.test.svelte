<script lang="ts">
	import NumberField from "./NumberField.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:720px;grid-template-columns:repeat(2,1fr)"
>
	<NumberField label="Default" value={5} />
	<NumberField label="Small" size="sm" value={5} />
	<NumberField label="At minimum" value={0} min={0} max={10} />
	<NumberField label="At maximum" value={10} min={0} max={10} />
	<NumberField label="Description" description="Number of items" value={3} />
	<NumberField label="Error" error="Invalid value" value={42} />
	<NumberField label="Required" required value={1} />
	<NumberField label="Disabled" disabled value={7} />
	<NumberField label="Decimal step" step={0.5} value={2.5} />
	<NumberField label="Large value" value={123456789} />
</div>

<script lang="ts">
	import ColorPicker from "./ColorPicker.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;gap:16px;padding:16px;width:640px;grid-template-columns:repeat(2,280px);align-items:start"
>
	<ColorPicker label="Default" value="oklch(0.6 0.15 250)" />
	<ColorPicker label="Alpha and swatches" value="oklch(0.7 0.18 145 / 0.6)" alpha swatches={["#ef4444", "#22c55e", "#3b82f6"]} />
	<ColorPicker label="Warm" value="oklch(0.75 0.15 60)" />
	<ColorPicker label="Disabled" value="oklch(0.6 0.15 250)" alpha disabled />
</div>

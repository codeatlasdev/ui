<script lang="ts">
	import Stack from "./Stack.svelte";

	const box = (c: string, w = 80, h = 24) =>
		`display:block;width:${w}px;height:${h}px;border-radius:6px;background:${c}`;
	const frame = "border:1px dashed #888;width:200px;height:200px";
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(3,200px);gap:16px;padding:16px;width:max-content"
>
	<div style={frame}>
		<Stack>
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Stack>
	</div>
	<div style={frame}>
		<Stack gap="4">
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Stack>
	</div>
	<div style={frame}>
		<Stack gap="6" align="center">
			{#snippet children()}<i style={box("#e11d48", 40)}></i><i style={box("#2563eb", 80)}></i><i style={box("#16a34a", 60)}></i>{/snippet}
		</Stack>
	</div>
	<div style={frame}>
		<Stack gap="2" align="end">
			{#snippet children()}<i style={box("#e11d48", 40)}></i><i style={box("#2563eb", 80)}></i>{/snippet}
		</Stack>
	</div>
	<div style={frame}>
		<Stack gap="2" justify="center" align="center">
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i>{/snippet}
		</Stack>
	</div>
	<div style={frame}>
		<Stack gap="2" justify="between">
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Stack>
	</div>
</div>

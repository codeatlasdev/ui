<script lang="ts">
	import Row from "./Row.svelte";

	const box = (c: string, w = 40, h = 40) =>
		`display:block;width:${w}px;height:${h}px;border-radius:6px;background:${c}`;
	const frame = "border:1px dashed #888;width:360px";
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:max-content">
	<div style={frame}>
		<Row>
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Row>
	</div>
	<div style={frame}>
		<Row gap={16}>
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Row>
	</div>
	<div style={frame}>
		<Row gap="8" justify="space-between">
			{#snippet children()}<i style={box("#e11d48")}></i><i style={box("#2563eb")}></i><i style={box("#16a34a")}></i>{/snippet}
		</Row>
	</div>
	<div style={frame}>
		<Row gap={8} justify="center" align="center">
			{#snippet children()}<i style={box("#e11d48", 40, 20)}></i><i style={box("#2563eb", 40, 60)}></i><i style={box("#16a34a", 40, 30)}></i>{/snippet}
		</Row>
	</div>
	<div style={frame}>
		<Row gap={8} align="flex-end" justify="flex-end">
			{#snippet children()}<i style={box("#e11d48", 40, 20)}></i><i style={box("#2563eb", 40, 60)}></i>{/snippet}
		</Row>
	</div>
	<div style={frame}>
		<Row gap={8} wrap>
			{#snippet children()}
				{#each ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2", "#db2777", "#475569"] as c (c)}
					<i style={box(c, 80, 30)}></i>
				{/each}
			{/snippet}
		</Row>
	</div>
</div>

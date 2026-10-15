<script lang="ts">
	import Grid from "./Grid.svelte";

	const colors = ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2"];
	const cell = (c: string, h = 32) => `height:${h}px;border-radius:6px;background:${c}`;
	const frame = "border:1px dashed #888;width:360px";
</script>

{#snippet cells()}
	{#each colors as c (c)}<div style={cell(c)}></div>{/each}
{/snippet}

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:max-content">
	<div style={frame}><Grid>{#snippet children()}{@render cells()}{/snippet}</Grid></div>
	<div style={frame}><Grid columns={3} gap="2">{#snippet children()}{@render cells()}{/snippet}</Grid></div>
	<div style={frame}><Grid columns={{ base: 1, md: 2 }} gap="3">{#snippet children()}{@render cells()}{/snippet}</Grid></div>
	<div style={frame}>
		<Grid columns={4} gap="4">
			{#snippet children()}{@render cells()}{/snippet}
		</Grid>
	</div>
	<div style={frame}>
		<Grid columns={3} gap="1">{#snippet children()}{@render cells()}{/snippet}</Grid>
	</div>
	<div style={frame}>
		<Grid columns={3} gap="2" align="center">
			{#snippet children()}
				<div style="height:16px;width:40px;background:#e11d48"></div>
				<div style="height:40px;width:40px;background:#2563eb"></div>
				<div style="height:24px;width:40px;background:#16a34a"></div>
			{/snippet}
		</Grid>
	</div>
</div>

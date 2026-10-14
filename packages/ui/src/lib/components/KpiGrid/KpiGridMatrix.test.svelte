<script lang="ts">
	import KpiCard from "../KpiCard/KpiCard.svelte";
	import KpiGrid from "./KpiGrid.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:24px;padding:16px;width:max-content">
	{#each [[3, 344], [3, 528], [4, 344], [4, 712], [6, 528]] as [count, px] (`${count}-${px}`)}
		<div style:width="{px}px">
			<KpiGrid>
				{#each Array.from({ length: count }, (_, i) => i) as i (i)}
					<KpiCard title={`Metric ${i + 1}`} value={(i + 1) * 128} trend={i % 2 ? -1.5 : 4.2} />
				{/each}
			</KpiGrid>
		</div>
	{/each}
</div>

<script lang="ts">
	import { DollarSign, Users } from "@lucide/svelte";
	import KpiCard from "./KpiCard.svelte";
</script>

<div
	data-testid="matrix"
	style="display:grid;grid-template-columns:repeat(3,240px);gap:16px;padding:16px;width:max-content"
>
	<KpiCard title="Revenue" value="12.450" unit="BRL" trend={12.5} icon={DollarSign} />
	<KpiCard title="Users" value={1280} trend={-3.2} icon={Users} />
	<KpiCard title="Conversion" value="4,2" unit="%" trend={0} />
	<KpiCard title="No trend" value={87} />
	<KpiCard title="With icon" value={87} icon={Users} />
	<KpiCard title="Very long title to check line wrapping" value="1.234.567" unit="un" trend={100} />
</div>

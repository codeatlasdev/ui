<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { Sparkline } from '@codeatlasdev/ui/charts';
  import { UserMinus, Users } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Active users" value="24.8k" trend={12.1} icon={Users}>
    {#snippet chart()}<Sparkline data={[18, 19, 21, 20, 23, 25]} trend="up" />{/snippet}
  </KpiCard>
  <KpiCard title="Churn" value="1.7" unit="%" trend={-0.2} trendTone="positive-down" hint="Down from 2.4% in January" icon={UserMinus}>
    {#snippet chart()}<Sparkline data={[2.4, 2.3, 2.1, 2.2, 1.9, 1.7]} trend="up" variant="bar" />{/snippet}
  </KpiCard>
</KpiGrid>

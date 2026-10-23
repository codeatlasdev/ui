<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { Activity, Gauge, UserMinus } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Churn Rate" value="5.2" unit="%" trend={-1.8} trendTone="positive-down" icon={UserMinus} />
  <KpiCard title="Response Time" value="1.4" unit="s" trend={12.3} trendTone="positive-down" icon={Gauge} />
  <KpiCard title="Sessions" value="3,847" trend={-2.1} trendTone="neutral" icon={Activity} />
</KpiGrid>

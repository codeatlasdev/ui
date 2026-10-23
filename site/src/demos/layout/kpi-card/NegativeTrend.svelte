<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { Activity } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Churn Rate" value="5.2" unit="%" trend={-1.8} trendTone="positive-down" icon={Activity} />
  <KpiCard title="Response Time" value="1.4" unit="s" trend={-12.3} trendTone="positive-down" />
</KpiGrid>

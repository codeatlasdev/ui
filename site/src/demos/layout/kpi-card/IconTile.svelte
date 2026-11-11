<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { Users, DollarSign, AlertTriangle, Activity } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Revenue" value="$48,200" trend={12.4} icon={DollarSign} iconStyle="tile" />
  <KpiCard title="Active users" value="3,847" trend={8.1} icon={Users} iconStyle="tile" tone="success" />
  <KpiCard title="Open incidents" value="7" trend={40} trendTone="positive-down" icon={AlertTriangle} iconStyle="tile" tone="warning" />
  <KpiCard title="Error rate" value="1.2" unit="%" trend={-0.3} trendTone="positive-down" icon={Activity} iconStyle="tile" tone="error" />
</KpiGrid>

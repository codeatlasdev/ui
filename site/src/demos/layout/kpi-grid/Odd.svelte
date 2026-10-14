<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { Users, DollarSign, TrendingUp } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Revenue" value="$112k" trend={18.4} icon={DollarSign} />
  <KpiCard title="Users" value="24.8k" trend={12.1} icon={Users} />
  <KpiCard title="Growth" value="34" unit="%" trend={5.6} icon={TrendingUp} />
</KpiGrid>

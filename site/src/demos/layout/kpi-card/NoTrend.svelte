<script lang="ts">
  import { KpiCard, KpiGrid } from '@codeatlasdev/ui';
  import { ShoppingCart } from '@lucide/svelte';
</script>

<KpiGrid>
  <KpiCard title="Orders Today" value="124" icon={ShoppingCart} />
  <KpiCard title="Avg. Session" value="3m 42s" />
  <KpiCard title="Error Rate" value="0.03" unit="%" />
</KpiGrid>

<script lang="ts">
  import { PageShell, KpiCard, KpiGrid, GlassCard } from '@codeatlasdev/ui';
  import { Users, DollarSign, TrendingUp, Activity } from '@lucide/svelte';
</script>

<div class="frame">
  <PageShell title="Dashboard">
    <KpiGrid>
      <KpiCard title="Revenue" value="$118k" trend={23.4} icon={DollarSign} />
      <KpiCard title="Users" value="24.8k" trend={8.1} icon={Users} />
      <KpiCard title="Growth" value="34%" trend={5.6} icon={TrendingUp} />
      <KpiCard title="Uptime" value="99.9%" trend={0.1} icon={Activity} />
    </KpiGrid>
    <GlassCard full>
      <p class="placeholder">Chart or data table goes here</p>
    </GlassCard>
  </PageShell>
</div>

<style>
  .frame {
    width: 100%;
    height: 420px;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .placeholder {
    margin: 0;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ca-text-hint);
    font-size: var(--ca-font-size-body2);
  }
</style>

<script lang="ts">
  import { PageShell, KpiCard, KpiGrid, GlassCard, Stack, Button } from '@codeatlasdev/ui';
  import { TrendingUp, Users, DollarSign, Activity } from '@lucide/svelte';
</script>

<GlassCard flush full>
  <PageShell title="Dashboard" description="Overview of this month">
    {#snippet actions()}<Button variant="filled" size="sm">New report</Button>{/snippet}

    <Stack gap={24}>
      <KpiGrid>
        <KpiCard title="Revenue" value="$118k" trend={23.4} icon={DollarSign} />
        <KpiCard title="Users" value="24.8k" trend={8.1} icon={Users} />
        <KpiCard title="Growth" value="34%" trend={5.6} icon={TrendingUp} />
        <KpiCard title="Uptime" value="99.9%" trend={0.1} icon={Activity} />
      </KpiGrid>

      <GlassCard full>
        <p class="placeholder">Chart or data table goes here</p>
      </GlassCard>
    </Stack>
  </PageShell>
</GlassCard>

<style>
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

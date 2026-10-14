<script lang="ts">
  import { GlassCard, Grid, KpiCard, KpiGrid, Stack } from '@codeatlasdev/ui';
  import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, GaugeChart, RadarChart, type CalendarHeatmapPoint } from '@codeatlasdev/ui/charts';
  import { TrendingUp, Users, DollarSign, Activity } from '@lucide/svelte';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [42000, 58000, 51000, 74000, 68000, 89000, 95000, 102000, 118000];
  const expenses = [31000, 39000, 36000, 48000, 52000, 58000, 61000, 66000, 72000];
  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  const calDays: CalendarHeatmapPoint[] = Array.from({ length: 200 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 2, 1 + i));
    return [d.toISOString().slice(0, 10), Math.round(10 + 8 * Math.sin(i * 0.17) * Math.cos(i * 0.05))];
  });

  const scatter = Array.from({ length: 60 }, (_, i): [number, number] => [
    Math.round(500 + 9500 * (0.5 + 0.5 * Math.sin(i * 0.37 + 0.4))),
    parseFloat((0.5 + 11.5 * (0.5 + 0.5 * Math.cos(i * 0.29 + 1.1))).toFixed(2)),
  ]);
</script>

<Stack gap={16}>
  <KpiGrid>
    <KpiCard title="Revenue" value="$118k" trend={23.4} icon={DollarSign} />
    <KpiCard title="Users" value="94.2k" trend={8.1} icon={Users} />
    <KpiCard title="Growth" value="34%" trend={5.6} icon={TrendingUp} />
    <KpiCard title="Uptime" value="99.9%" trend={0.1} icon={Activity} />
  </KpiGrid>

  <GlassCard full>
    <LineChart series={[{ name: 'Revenue', data: revenue }, { name: 'Expenses', data: expenses }]} categories={months} valueFormatter={fmt} area height="280px" />
  </GlassCard>

  <Grid cols="repeat(auto-fit,minmax(280px,1fr))" gap={16}>
    <GlassCard>
      <BarChart
        series={[
          { name: 'Organic', data: [12400, 18200, 22600, 28800] },
          { name: 'Paid', data: [8200, 11600, 14800, 19200] },
          { name: 'Referral', data: [4800, 6200, 8400, 11600] },
          { name: 'Direct', data: [3200, 4800, 6200, 8400] },
        ]}
        categories={['Q1', 'Q2', 'Q3', 'Q4']}
        valueFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        stacked
        height="260px"
      />
    </GlassCard>
    <GlassCard>
      <PieChart
        data={[
          { value: 38, name: 'Product A' },
          { value: 27, name: 'Product B' },
          { value: 19, name: 'Product C' },
          { value: 10, name: 'Product D' },
          { value: 6, name: 'Other' },
        ]}
        donut
        height="260px"
      />
    </GlassCard>
  </Grid>

  <GlassCard full>
    <ScatterChart series={[{ name: 'Accounts', data: scatter }]} yName="Conversion %" yFormatter={(v) => `${v.toFixed(1)}%`} height="260px" />
  </GlassCard>

  <Grid cols="repeat(auto-fit,minmax(280px,1fr))" gap={16}>
    <GlassCard>
      <HeatmapChart variant="calendar" data={calDays} range={['2026-03-01', '2026-09-18']} height="140px" />
    </GlassCard>
    <GlassCard>
      <GaugeChart value={84} label="Score" height="220px" />
    </GlassCard>
  </Grid>

  <GlassCard full>
    <RadarChart
      indicators={['Speed', 'Quality', 'Reliability', 'Innovation', 'Support'].map((name) => ({ name, max: 100 }))}
      series={[
        { name: 'Team A', values: [88, 92, 76, 85, 94] },
        { name: 'Team B', values: [74, 68, 90, 72, 81] },
      ]}
      height="280px"
    />
  </GlassCard>
</Stack>

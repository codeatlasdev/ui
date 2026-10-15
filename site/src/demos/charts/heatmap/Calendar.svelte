<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { HeatmapChart, type CalendarHeatmapPoint } from '@codeatlasdev/ui/charts';

  // [ 'YYYY-MM-DD', value ] per day.
  const data: CalendarHeatmapPoint[] = Array.from({ length: 258 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 0, 1 + i));
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const v = weekend
      ? Math.max(0, Math.round(Math.sin(i * 0.3 + 1.4) * 2 + 1))
      : Math.max(0, Math.min(20, Math.round(Math.sin(i * 0.08 + 1.4) * 5 + Math.sin(i * 0.21 + 1.8) * 3 + 8)));
    return [d.toISOString().slice(0, 10), v];
  });
</script>

<Card material="glass" full>
  <HeatmapChart variant="calendar" {data} range={['2026-01-01', '2026-09-15']} tooltipFormatter={(v) => `${v} commits`} height="160px" />
</Card>

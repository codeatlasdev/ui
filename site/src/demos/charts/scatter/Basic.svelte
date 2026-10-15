<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { ScatterChart } from '@codeatlasdev/ui/charts';

  const data = Array.from({ length: 80 }, (_, i): [number, number] => [
    Math.round(500 + 14500 * (0.5 + 0.5 * Math.sin(i * 0.31 + 1.2)) * (0.7 + 0.3 * Math.cos(i * 0.17))),
    parseFloat((0.5 + 13.5 * (0.5 + 0.5 * Math.cos(i * 0.23 + 0.8)) * (0.6 + 0.4 * Math.sin(i * 0.41))).toFixed(2)),
  ]);
</script>

<Card material="glass" full>
  <ScatterChart series={[{ name: 'Data points', data }]} yName="Conversion %" yFormatter={(v) => `${v.toFixed(1)}%`} height="320px" />
</Card>

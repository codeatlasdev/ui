<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { BarChart } from '@codeatlasdev/ui/charts';

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;
</script>

<Card material="glass" full>
  <BarChart series={[{ name: 'Revenue', data: [38400, 54200, 71600, 89800] }]} categories={['Q1', 'Q2', 'Q3', 'Q4']} valueFormatter={fmt} height="300px" />
</Card>

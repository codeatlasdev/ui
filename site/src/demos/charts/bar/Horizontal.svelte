<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { BarChart } from '@codeatlasdev/ui/charts';

  const products = ['Atlas Pro', 'Nova Suite', 'Relay SDK', 'Mesh API', 'Drift UI', 'Pulse DB', 'Forge CI', 'Orbit ML'];
</script>

<Card material="glass" full>
  <BarChart
    series={[{ name: 'Sales', data: [9840, 8720, 7650, 6430, 5980, 4810, 3920, 3140] }]}
    categories={products}
    valueFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
    horizontal
    height="300px"
  />
</Card>

<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { LineChart } from '@codeatlasdev/ui/charts';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [42000, 51000, 58000, 63000, 72000, 80000, 88000, 95000, 112000];
  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;
</script>

<Card material="glass" full>
  <LineChart series={[{ name: 'Revenue', data: revenue }]} categories={months} valueFormatter={fmt} area height="360px" />
</Card>

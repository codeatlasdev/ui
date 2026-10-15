<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { LineChart } from '@codeatlasdev/ui/charts';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [42000, 51000, 58000, 63000, 72000, 80000, 88000, 95000, 112000];
  const expenses = [38000, 41000, 44000, 47000, 52000, 55000, 58000, 61000, 67000];
  const profit = revenue.map((r, i) => r - expenses[i]);
  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;
</script>

<Card material="glass" full>
  <LineChart
    series={[
      { name: 'Revenue', data: revenue },
      { name: 'Expenses', data: expenses },
      { name: 'Profit', data: profit },
    ]}
    categories={months}
    valueFormatter={fmt}
    height="300px"
  />
</Card>

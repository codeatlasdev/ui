<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { PieChart } from '@codeatlasdev/ui/charts';

  const marketData = [
    { value: 38, name: 'Cloud Services' },
    { value: 24, name: 'Enterprise SW' },
    { value: 18, name: 'SaaS Tools' },
    { value: 12, name: 'Infrastructure' },
    { value: 8, name: 'Other' },
  ];
</script>

<Card material="glass" full>
  <PieChart data={marketData} donut centerLabel={{ value: '$2.4M', label: 'Total Revenue' }} height="300px" />
</Card>

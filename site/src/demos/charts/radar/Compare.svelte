<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { RadarChart } from '@codeatlasdev/ui/charts';

  const indicators = ['Speed', 'Quality', 'Reliability', 'Innovation', 'Support', 'Coverage'].map((name) => ({ name, max: 100 }));
</script>

<Card material="glass" full>
  <RadarChart
    {indicators}
    series={[
      { name: 'Team A', values: [88, 92, 76, 85, 94, 79] },
      { name: 'Team B', values: [74, 68, 90, 72, 81, 83] },
    ]}
    height="340px"
  />
</Card>

<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { PieChart } from '@codeatlasdev/ui/charts';

  const roseData = [
    { value: 72, name: 'Analytics' },
    { value: 58, name: 'Automation' },
    { value: 45, name: 'Security' },
    { value: 38, name: 'Integrations' },
    { value: 30, name: 'Storage' },
    { value: 22, name: 'Support' },
  ];
</script>

<Card material="glass" full><PieChart data={roseData} rose height="340px" /></Card>

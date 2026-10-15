<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
  import { LineChart } from '@codeatlasdev/ui/charts';
  import { onMount } from 'svelte';

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  let streamData = $state<number[]>([
    68000, 71000, 65000, 73000, 79000, 76000, 82000, 85000, 78000, 88000,
    91000, 86000, 94000, 98000, 103000, 99000, 107000, 112000, 108000, 115000,
  ]);

  onMount(() => {
    const id = setInterval(() => {
      const last = streamData[streamData.length - 1];
      const next = Math.min(125000, Math.max(42000, last + (Math.random() - 0.45) * 8000));
      streamData = [...streamData.slice(1), next];
    }, 800);
    return () => clearInterval(id);
  });
</script>

<Card material="glass" full>
  <LineChart
    series={[{ name: 'Live revenue', data: streamData }]}
    categories={streamData.map((_, i) => String(i))}
    valueFormatter={fmt}
    height="300px"
  />
</Card>

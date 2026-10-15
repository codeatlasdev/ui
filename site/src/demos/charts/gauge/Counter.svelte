<script lang="ts">
  import { Card, Stack } from '@codeatlasdev/ui';
  import { GaugeChart } from '@codeatlasdev/ui/charts';
  import { onMount } from 'svelte';

  let value = $state(0);
  const label = $derived(value < 40 ? 'Needs work' : value <= 70 ? 'Good' : 'Excellent');

  onMount(() => {
    const id = setInterval(() => {
      value = Math.min(value + 2, 94);
      if (value >= 94) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  });
</script>

<Card material="glass" full>
  <Stack gap="3">
    <GaugeChart {value} variant="ring" formatter={(v) => String(Math.round(v))} height="260px" />
    <p class="label">{label}</p>
  </Stack>
</Card>

<style>
  .label { text-align: center; font-size: var(--ca-font-size-h6); font-weight: 700; color: var(--ca-semantic-success); margin: 0; }
</style>

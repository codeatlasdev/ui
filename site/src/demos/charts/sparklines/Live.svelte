<script lang="ts">
  import { Card, Grid, Stack, Flex } from '@codeatlasdev/ui';
  import { Sparkline } from '@codeatlasdev/ui/charts';
  import { onMount } from 'svelte';

  let live = $state({
    cpu: [45, 48, 52, 49, 55, 58, 54, 60, 57, 62],
    mem: [62, 65, 63, 67, 70, 68, 72, 71, 74, 73],
    net: [12, 18, 15, 22, 19, 28, 24, 31, 27, 35],
  });

  const next = (a: number[], lo: number, hi: number, step: number) =>
    [...a.slice(1), Math.min(hi, Math.max(lo, a[a.length - 1] + (Math.random() - 0.45) * step))];

  onMount(() => {
    const id = setInterval(() => {
      live = { cpu: next(live.cpu, 20, 95, 8), mem: next(live.mem, 40, 95, 5), net: next(live.net, 5, 80, 12) };
    }, 600);
    return () => clearInterval(id);
  });

  const metrics = $derived([
    { label: 'CPU', data: live.cpu },
    { label: 'Memory', data: live.mem },
    { label: 'Network', data: live.net },
  ]);
</script>

<Grid class="grid-auto-200" gap="4">
  {#each metrics as m}
    <Card material="glass">
      <Stack gap="1">
        <Flex justify="between">
          <span class="label">{m.label}</span>
          <span class="value">{m.data[m.data.length - 1].toFixed(0)}%</span>
        </Flex>
        <Sparkline data={m.data} height="40px" />
      </Stack>
    </Card>
  {/each}
</Grid>

<style>
  :global(.grid-auto-200) { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .label { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .value { color: var(--ca-brand-text); font-weight: 600; }
</style>

<script lang="ts">
  import { Card, Stack, Slider } from '@codeatlasdev/ui';
  import { GaugeChart } from '@codeatlasdev/ui/charts';

  let value = $state(65);
</script>

<Card material="glass" full>
  <Stack gap="5">
    <GaugeChart {value} variant="ring" height="260px" />
    <div class="slider"><Slider bind:value min={0} max={100} step={1} /></div>
  </Stack>
</Card>

<style>
  .slider { padding: 0 var(--ca-space-3); }
</style>

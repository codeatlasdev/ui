<script lang="ts">
  import { Button, LoadingBoundary, Stack } from '@codeatlasdev/ui';
  import Report from './Report.svelte';

  let ms = $state(1500);
  let run = $state(0);
  const load = (wait: number) => () =>
    new Promise<string[]>((r) => setTimeout(() => r(['Invoice 1042', 'Invoice 1043', 'Invoice 1044']), wait));
</script>

<Stack gap="4">
  <Stack direction="row" gap="2">
    <Button variant="outlined" size="sm" onclick={() => { ms = 100; run++; }}>Fast (100 ms)</Button>
    <Button variant="outlined" size="sm" onclick={() => { ms = 1500; run++; }}>Slow (1.5 s)</Button>
  </Stack>
  {#key run}
    <LoadingBoundary label="Loading invoices">
      <Report load={load(ms)} />
    </LoadingBoundary>
  {/key}
</Stack>

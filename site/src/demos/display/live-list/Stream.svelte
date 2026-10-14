<script lang="ts">
  import { LiveList, Button, Chip } from '@codeatlasdev/ui';
  import { onDestroy } from 'svelte';

  type Check = { domain: string; free: boolean };
  const names = ['atlas', 'nimbus', 'orbit', 'prism', 'quill', 'ripple', 'sable', 'tundra', 'umbra', 'vertex', 'willow', 'zephyr'];
  const TOTAL = 40;

  let items = $state<Check[]>([]);
  let status = $state<'idle' | 'running' | 'done'>('idle');
  let timer: ReturnType<typeof setInterval> | undefined;

  function start() {
    items = [];
    status = 'running';
    clearInterval(timer);
    timer = setInterval(() => {
      const i = items.length;
      items.push({ domain: `${names[i % names.length]}${i}.com`, free: i % 3 !== 0 });
      if (items.length >= TOTAL) {
        clearInterval(timer);
        status = 'done';
      }
    }, 150);
  }
  onDestroy(() => clearInterval(timer));
</script>

<div class="wrap">
  <Button variant="filled" onclick={start} disabled={status === 'running'}>
    {status === 'running' ? 'Checking…' : 'Start bulk check'}
  </Button>
  <LiveList {items} total={TOTAL} {status} label="Domain checks" height="14rem">
    {#snippet item(row)}
      <span class="domain">{row.domain}</span>
      <Chip size="sm" variant={row.free ? 'success' : 'default'} label={row.free ? 'Available' : 'Taken'} />
    {/snippet}
  </LiveList>
</div>

<style>
  .wrap { display: grid; gap: var(--ca-space-3); width: 100%; }
  .domain { flex: 1; font-family: var(--ca-font-mono); }
</style>

<script lang="ts">
  import { Flex, Stack } from '@codeatlasdev/ui';
  import { Sparkline } from '@codeatlasdev/ui/charts';

  const items = [
    { label: 'Weekly sessions', data: [42, 38, 55, 61, 48, 72, 65], trend: 'up' as const },
    { label: 'Bounce rate', data: [38, 41, 37, 43, 36, 39, 35], trend: 'down' as const },
    { label: 'Avg pages', data: [3.2, 3.4, 3.1, 3.5, 3.3, 3.4, 3.6], trend: 'neutral' as const },
  ];
</script>

<Flex gap="6" wrap align="center">
  {#each items as s}
    <div class="item">
      <Stack gap="1.5">
        <span class="label">{s.label}</span>
        <Sparkline data={s.data} variant="bar" trend={s.trend} height="40px" />
      </Stack>
    </div>
  {/each}
</Flex>

<style>
  .item { width: 160px; }
  .label { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import { untrack } from 'svelte';
  import SegmentedControl from './SegmentedControl.svelte';

  let {
    long = false,
    gap = '',
    initial = undefined,
    width = '',
    ...rest
  }: { long?: boolean; gap?: string; initial?: string; width?: string; [key: string]: unknown } = $props();
  let value = $state<string | undefined>(untrack(() => initial));
  const items = $derived([
    { value: 'a', label: '10' },
    { value: 'b', label: long ? 'Twenty results per search' : '20' },
    { value: 'c', label: '100' },
  ]);
</script>

<div style="{width ? `width:${width};` : ''}{gap ? `--ca-seg-gap:${gap}` : ''}">
  <SegmentedControl bind:value {...rest} {items} />
</div>
<output data-testid="bound">{value ?? ''}</output>

<script lang="ts">
  import { untrack } from 'svelte';
  import ColorPicker from './ColorPicker.svelte';

  let { initial = 'oklch(0.6 0.15 250)', ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<ColorPicker label="Brand" bind:value {...rest} />
<output data-testid="bound">{value}</output>

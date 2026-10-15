<script lang="ts">
  import { untrack } from 'svelte';
  import SwatchGroup from './SwatchGroup.svelte';

  let { initial = '', ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<SwatchGroup
  bind:value
  {...rest}
  items={[
    { value: 'amber' },
    { value: 'ocean', label: 'Ocean blue' },
    { value: 'violet', disabled: true },
    { value: 'brand', label: 'Brand', color: '#e8590c' },
  ]}
/>
<output data-testid="bound">{value}</output>

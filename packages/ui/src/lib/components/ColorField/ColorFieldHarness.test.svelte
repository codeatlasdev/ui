<script lang="ts">
  import { untrack } from 'svelte';
  import ColorField from './ColorField.svelte';

  let { initial = '#2b5fd9', ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<ColorField label="Brand" bind:value {...rest} />
<output data-testid="bound">{value}</output>

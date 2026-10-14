<script lang="ts">
  import { untrack } from 'svelte';
  import Select from './Select.svelte';

  let { initial = undefined, options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ], ...rest }: { initial?: string; options?: { value: string; label: string }[]; [key: string]: unknown } = $props();
  let value = $state<string | undefined>(untrack(() => initial));
</script>

<Select bind:value {...rest} {options} />
<output data-testid="bound">{value === undefined ? 'undefined' : `[${value}]`}</output>

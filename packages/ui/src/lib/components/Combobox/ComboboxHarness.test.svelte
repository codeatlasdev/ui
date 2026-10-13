<script lang="ts">
  import { untrack } from 'svelte';
  import Combobox from './Combobox.svelte';

  let { initial = '', ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<Combobox bind:value {...rest} options={[
  { value: 'ny', label: 'New York' },
  { value: 'la', label: 'Los Angeles' },
  { value: 'chi', label: 'Chicago' },
]} />
<output data-testid="bound">{value}</output>

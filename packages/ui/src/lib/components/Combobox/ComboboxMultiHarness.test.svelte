<script lang="ts">
  import { untrack } from 'svelte';
  import Combobox from './Combobox.svelte';

  let { initial = [], ...rest }: { initial?: string[]; [key: string]: unknown } = $props();
  // Two-way bound: proves `bind:value` works with an array in multiple mode.
  let value = $state<string[]>(untrack(() => [...(initial as string[])]));
</script>

<Combobox
  multiple
  bind:value
  {...rest}
  options={[
    { value: 'bug', label: 'Bug' },
    { value: 'docs', label: 'Docs' },
    { value: 'ui', label: 'UI' },
    { value: 'old', label: 'Old', disabled: true },
  ]}
/>
<output data-testid="bound">{value.join(',')}</output>

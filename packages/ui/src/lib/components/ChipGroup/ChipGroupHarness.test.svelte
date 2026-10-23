<script lang="ts">
  import { untrack } from 'svelte';
  import ChipGroup from './ChipGroup.svelte';

  let { initial = '', ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<form data-testid="form">
  <ChipGroup
    label="Sales team size"
    name="teamSize"
    bind:value
    items={[
      { value: '1', label: 'Just me' },
      { value: '2-5', label: '2 to 5' },
      { value: '6-20', label: '6 to 20' },
      { value: '21-50', label: '21 to 50' },
      { value: '50+', label: '50+' },
    ]}
    {...rest}
  />
</form>
<output data-testid="bound">{value}</output>

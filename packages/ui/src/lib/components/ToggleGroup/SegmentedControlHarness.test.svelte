<script lang="ts">
  import { untrack } from 'svelte';
  import SegmentedControl from './SegmentedControl.svelte';

  let { initial = undefined, ...rest }: { initial?: string; [key: string]: unknown } = $props();
  let value = $state<string | undefined>(untrack(() => initial));
</script>

<SegmentedControl bind:value {...rest} items={[
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]} />
<output data-testid="bound">{value ?? ''}</output>

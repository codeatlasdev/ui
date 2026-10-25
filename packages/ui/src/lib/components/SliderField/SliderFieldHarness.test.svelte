<script lang="ts">
  import { untrack } from 'svelte';
  import SliderField from './SliderField.svelte';

  let { initial = 0.8, ...rest }: { initial?: number; [key: string]: unknown } = $props();
  let value = $state(untrack(() => initial));
</script>

<SliderField label="Radius" bind:value min={0} max={2} step={0.05} unit="x" {...rest} />
<output data-testid="bound">{value}</output>

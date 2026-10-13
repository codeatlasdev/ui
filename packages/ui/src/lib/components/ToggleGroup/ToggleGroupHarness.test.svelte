<script lang="ts">
  import { untrack } from 'svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  let {
    type = 'single',
    initial = undefined,
    ...rest
  }: { type?: 'single' | 'multiple'; initial?: string | string[]; [key: string]: unknown } = $props();
  let value = $state<string | string[] | undefined>(untrack(() => initial));
  const single = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right', disabled: true },
  ];
  const multi = [
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
    { value: 'underline', label: 'Underline' },
  ];
</script>

<ToggleGroup {type} bind:value items={type === 'multiple' ? multi : single} {...rest} />
<output data-testid="bound">{Array.isArray(value) ? value.join(',') : (value ?? '')}</output>

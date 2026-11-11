<script lang="ts">
  import Combobox from './Combobox/Combobox.svelte';
  import { DateField } from './Date/index.js';
  import NumberField from './NumberField/NumberField.svelte';
  import Select from './Select/Select.svelte';
  import TextField from './TextField/TextField.svelte';

  let { style = '', ...rest }: { style?: string; [k: string]: unknown } = $props();
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
</script>

<div data-testid="host" {style}>
  <TextField label="Name" description="Hint text" revealable type="password" {...rest}>
    {#snippet below()}{/snippet}
  </TextField>
  <Select label="Letter" description="Hint text" {options} />
  <Combobox label="City" description="Hint text" {options} />
  <NumberField label="Qty" description="Hint text" />
  <DateField label="Day" description="Hint text" />
</div>

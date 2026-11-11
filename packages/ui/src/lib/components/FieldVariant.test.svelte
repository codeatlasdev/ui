<script lang="ts">
  import Combobox from './Combobox/Combobox.svelte';
  import { DateField } from './Date/index.js';
  import NumberField from './NumberField/NumberField.svelte';
  import Select from './Select/Select.svelte';
  import TextField from './TextField/TextField.svelte';

  let { style = '', variant, ...rest }: { style?: string; variant?: 'outlined' | 'filled' | 'underline'; [k: string]: unknown } = $props();
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
</script>

<div style={style}>
  <TextField label="Name" {variant} {...rest} />
  <Select label="Letter" {variant} {options} />
  <Combobox label="City" {variant} {options} />
  <NumberField label="Qty" {variant} />
  <DateField label="Day" {variant} />
</div>

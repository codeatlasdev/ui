<script lang="ts">
  // #1215: the same five fields and a bare Label, all `required` or all `optional`.
  import Combobox from '../Combobox/Combobox.svelte';
  import NumberField from '../NumberField/NumberField.svelte';
  import Select from '../Select/Select.svelte';
  import TextArea from '../TextArea/TextArea.svelte';
  import TextField from '../TextField/TextField.svelte';
  import Label from './Label.svelte';

  let { mode }: { mode: 'required' | 'optional' } = $props();
  const required = $derived(mode === 'required');
  const optional = $derived(mode === 'optional');
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];
</script>

<TextField label="Nickname" {required} {optional} />
<TextArea label="Bio" {required} {optional} />
<NumberField label="Age" {required} {optional} />
<Select label="Plan" {options} {required} {optional} />
<Combobox label="Team" {options} {required} {optional} />
<Label for="free" {required} {optional}>Notes</Label>
<input id="free" />

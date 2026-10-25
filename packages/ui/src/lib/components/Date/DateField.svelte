<script lang="ts">
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { defaultDate } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import './date.css';

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected date. Bindable. */
    value?:        DateValue;
    /** Starting point of an empty field (decides the segment format). Bindable. */
    placeholder?:  DateValue;
    minValue?:     DateValue;
    maxValue?:     DateValue;
    locale?:       string;
    /** Adds hour/minute(/second) segments. Default 'day'. */
    granularity?:  'day' | 'hour' | 'minute' | 'second';
    hourCycle?:    12 | 24;
    size?:         'sm' | 'md';
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    onchange?:     (value: DateValue | undefined) => void;
    class?:        string;
  }

  let {
    label,
    description,
    error,
    disabled    = false,
    required    = false,
    readonly    = false,
    value       = $bindable(),
    placeholder = $bindable(),
    minValue,
    maxValue,
    locale      = 'pt-BR',
    granularity = 'day',
    hourCycle,
    size        = 'md',
    name,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('df');

  let wrap = $state<HTMLElement | null>(null);

  // Empty field: the placeholder decides the segment format and the base for typed values.
  const basePlaceholder = $derived(
    placeholder ?? defaultDate({ granularity, minValue, maxValue }),
  );

  const field = new FieldState({
    mode: 'date',
    getValue: () => value,
    setValue: (v) => {
      value = v as DateValue | undefined;
      if (v) placeholder = v as DateValue;
      onchange?.(value);
    },
    getPlaceholder: () => basePlaceholder,
    getLocale: () => locale,
    getGranularity: () => granularity,
    getHourCycle: () => hourCycle,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getMin: () => minValue,
    getMax: () => maxValue,
    getRoot: () => wrap,
    announce,
  });

  $effect(() => field.sync(value));
</script>

<DateFieldShell
  {id}
  {field}
  {label}
  {description}
  {error}
  {disabled}
  {readonly}
  {required}
  {size}
  class={className}
  {name}
  formValue={value?.toString()}
  bind:wrap
/>

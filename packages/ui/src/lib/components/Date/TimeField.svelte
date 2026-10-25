<script lang="ts">
  import { Time } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { FieldState } from './field-state.svelte.js';
  import type { TimeValue } from './types.js';
  import './date.css';

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected time. Bindable. Use `new Time(h, m)` from `@internationalized/date`. */
    value?:        Time;
    /** Starting point of an empty field. Bindable. */
    placeholder?:  TimeValue;
    minValue?:     TimeValue;
    maxValue?:     TimeValue;
    locale?:       string;
    /** Default 'minute'. */
    granularity?:  'hour' | 'minute' | 'second';
    /** Default follows the locale (pt-BR → 24h). */
    hourCycle?:    12 | 24;
    size?:         'sm' | 'md';
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    onchange?:     (value: Time | undefined) => void;
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
    granularity = 'minute',
    hourCycle,
    size        = 'md',
    name,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('tmf');

  let wrap = $state<HTMLElement | null>(null);

  const basePlaceholder = $derived(placeholder ?? new Time(0, 0, 0));

  const field = new FieldState({
    mode: 'time',
    getValue: () => value,
    setValue: (v) => {
      value = v as Time | undefined;
      if (v) placeholder = v as Time;
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

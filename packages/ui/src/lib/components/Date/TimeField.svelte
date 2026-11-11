<script lang="ts">
  import { Time } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import { fieldWidth, type FieldWidth } from '../../utils/field-width.js';
  import type { FieldVariant } from '../../theme/components.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { FieldState } from './field-state.svelte.js';
  import type { TimeValue } from './types.js';
  import './date.css';

  interface Props {
    label?:        string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`), for a field in a toolbar, table or grid that already shows its name. */
    hideLabel?:    boolean;
    /** `full` (default), `auto`, `fit` or a CSS length (`--ca-field-width`). */
    width?:        FieldWidth;
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
    /** How the field is drawn: `outlined` (the style's own), `filled` or `underline`. Default follows the theme (`components.field.variant`). */
    variant?:         FieldVariant;
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    onchange?:     (value: Time | undefined) => void;
    class?:        string;
  }

  let {
    label,
    hideLabel    = false,
    width,
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
    variant,
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
  {hideLabel}
  width={fieldWidth(width)}
  {description}
  {error}
  {disabled}
  {readonly}
  {required}
  {size}
  {variant}
  class={className}
  {name}
  formValue={value?.toString()}
  bind:wrap
/>

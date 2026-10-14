<script lang="ts">
  import { Time } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import DateSegments from './DateSegments.svelte';
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

  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);
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

<div class="ca-date {className}" class:ca-date--sm={size === 'sm'} class:ca-date--error={!!error} class:ca-date--disabled={disabled}>
  {#if label}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="ca-date__label" id="{id}-label" onclick={() => !disabled && field.focusFirst()}>
      {label}{#if required}<span class="ca-date__req" aria-hidden="true"> *</span>{/if}
    </div>
  {/if}

  <div
    class="ca-date__wrap"
    role="group"
    bind:this={wrap}
    aria-labelledby={label ? `${id}-label` : undefined}
    aria-describedby={describedBy}
    aria-disabled={disabled}
    data-invalid={error || field.invalid ? '' : undefined}
    data-disabled={disabled ? '' : undefined}
  >
    <DateSegments
      {field}
      base={id}
      labelId={label ? `${id}-label` : undefined}
      {disabled}
      {readonly}
      invalid={!!error || field.invalid}
    />
  </div>
  {#if name}
    <input
      {name}
      value={value?.toString() ?? ''}
      {required}
      tabindex="-1"
      aria-hidden="true"
      class="ca-sr-only"
      style="transform:translateX(-100%)"
    />
  {/if}

  {#if error}
    <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{id}-hint" class="ca-date__hint">{description}</p>
  {/if}
</div>

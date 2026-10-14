<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { CalendarDays } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import CalendarBody from './CalendarBody.svelte';
  import { CalendarState } from './calendar-state.svelte.js';
  import DateSegments from './DateSegments.svelte';
  import { defaultDate, type WeekStart } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import './date.css';
  const t = useT();

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected date. Bindable. */
    value?:        DateValue;
    /** Controls the visible month when empty. Bindable. */
    placeholder?:  DateValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    minValue?:     DateValue;
    maxValue?:     DateValue;
    locale?:       string;
    /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    weekStartsOn?: WeekStart;
    /** Adds hour/minute segments to the field. Default 'day'. */
    granularity?:  'day' | 'hour' | 'minute' | 'second';
    numberOfMonths?: number;
    isDateDisabled?:    (date: DateValue) => boolean;
    isDateUnavailable?: (date: DateValue) => boolean;
    closeOnDateSelect?: boolean;
    size?:         'sm' | 'md';
    /** Name for the hidden input (ISO string) in native forms. */
    name?:         string;
    /** aria-label of the calendar button. */
    triggerLabel?: string;
    onchange?:     (value: DateValue | undefined) => void;
    class?:        string;
  }

  let {
    label,
    description,
    error,
    disabled     = false,
    required     = false,
    readonly     = false,
    value        = $bindable(),
    placeholder  = $bindable(),
    open         = $bindable(false),
    minValue,
    maxValue,
    locale       = 'pt-BR',
    weekStartsOn = 1,
    granularity  = 'day',
    numberOfMonths = 1,
    isDateDisabled,
    isDateUnavailable,
    closeOnDateSelect = true,
    size         = 'md',
    name,
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('dp');
  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);

  let wrap = $state<HTMLElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);

  const basePlaceholder = $derived(
    placeholder ?? defaultDate({ value, granularity, minValue, maxValue }),
  );

  function commit(v: DateValue | undefined) {
    value = v;
    if (v) placeholder = v;
    onchange?.(v);
  }

  const field = new FieldState({
    mode: 'date',
    getValue: () => value,
    setValue: (v) => commit(v as DateValue | undefined),
    getPlaceholder: () => basePlaceholder,
    getLocale: () => locale,
    getGranularity: () => granularity,
    getHourCycle: () => undefined,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getMin: () => minValue,
    getMax: () => maxValue,
    getRoot: () => wrap,
    announce,
  });
  $effect(() => field.sync(value));

  const cal = new CalendarState({
    mode: 'single',
    getValue: () => value,
    getRange: () => ({ start: undefined, end: undefined }),
    getPlaceholder: () => placeholder ?? value,
    setPlaceholder: (d) => (placeholder = d),
    commit,
    onSelect: () => {
      if (closeOnDateSelect) close(true);
    },
    getMin: () => minValue,
    getMax: () => maxValue,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getLocale: () => locale,
    getWeekStartsOn: () => weekStartsOn,
    getNumberOfMonths: () => numberOfMonths,
    getFixedWeeks: () => false,
    getIsDateDisabled: () => isDateDisabled,
    getIsDateUnavailable: () => isDateUnavailable,
    getLabel: () => label ?? t().calendar.label,
    announce,
  });

  function close(restoreFocus = false) {
    open = false;
    if (restoreFocus) triggerEl?.focus();
  }

  /**
   * Focus goes to this popover's own active day, without scrolling the page (other calendars may
   * sit further down).
   */
  function focusOwnDay(content: HTMLElement) {
    queueMicrotask(() => {
      const day =
        content.querySelector<HTMLElement>('[data-ca-day][data-focused]') ??
        content.querySelector<HTMLElement>('[data-ca-day]:not([data-disabled])');
      day?.focus({ preventScroll: true });
    });
  }
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
    data-state={open ? 'open' : undefined}
  >
    <DateSegments
      {field}
      base={id}
      labelId={label ? `${id}-label` : undefined}
      {disabled}
      {readonly}
      invalid={!!error || field.invalid}
    />
    <button
      type="button"
      class="ca-date__trigger"
      bind:this={triggerEl}
      aria-label={triggerLabel ?? t().calendar.openCalendar}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? `${id}-content` : undefined}
      data-segment="trigger"
      data-state={open ? 'open' : 'closed'}
      {disabled}
      onclick={() => {
        if (!readonly) open = !open;
      }}
    >
      <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  </div>
  {#if name}
    <input
      {name}
      value={value?.toString() ?? ''}
      {required}
      tabindex="-1"
      aria-hidden="true"
      style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;transform:translateX(-100%)"
    />
  {/if}

  {#if error}
    <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{id}-hint" class="ca-date__hint">{description}</p>
  {/if}
</div>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().calendar.label}
  onclose={() => close()}
  onopen={focusOwnDay}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    bind:this={cal.root}
    class="ca-cal"
    role="application"
    aria-label={cal.fullLabel}
    onkeydown={cal.onkeydown}
  >
    <div
      style="border:0;clip:rect(0,0,0,0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px"
    ><div role="heading" aria-level="2">{cal.fullLabel}</div></div>
    <CalendarBody state={cal} {disabled} {readonly} />
  </div>
</PickerPopover>

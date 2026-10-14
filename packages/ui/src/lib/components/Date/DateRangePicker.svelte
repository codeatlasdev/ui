<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { CalendarRange } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import CalendarBody from './CalendarBody.svelte';
  import { CalendarState } from './calendar-state.svelte.js';
  import DateSegments from './DateSegments.svelte';
  import { defaultDate, type WeekStart } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import type { DateRange } from './types.js';
  import './date.css';
  const t = useT();

  interface Props {
    label?:        string;
    description?:  string;
    error?:        string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    /** Selected range. Bindable. */
    value?:        DateRange;
    /** Controls the visible month when empty. Bindable. */
    placeholder?:  DateValue;
    /** Popover open state. Bindable. */
    open?:         boolean;
    minValue?:     DateValue;
    maxValue?:     DateValue;
    locale?:       string;
    /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    weekStartsOn?: WeekStart;
    numberOfMonths?: number;
    isDateDisabled?:    (date: DateValue) => boolean;
    isDateUnavailable?: (date: DateValue) => boolean;
    closeOnRangeSelect?: boolean;
    size?:         'sm' | 'md';
    /** aria-label of the calendar button. */
    triggerLabel?: string;
    onchange?:     (value: DateRange) => void;
    class?:        string;
  }

  let {
    label,
    description,
    error,
    disabled     = false,
    required     = false,
    readonly     = false,
    value        = $bindable({ start: undefined, end: undefined }),
    placeholder  = $bindable(),
    open         = $bindable(false),
    minValue,
    maxValue,
    locale       = 'pt-BR',
    weekStartsOn = 1,
    numberOfMonths = 2,
    isDateDisabled,
    isDateUnavailable,
    closeOnRangeSelect = true,
    size         = 'md',
    triggerLabel,
    onchange,
    class: className = '',
  }: Props = $props();

  const id = uid('drp');
  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);

  let wrap = $state<HTMLElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);

  const basePlaceholder = $derived(
    placeholder ?? defaultDate({ value: value.start, minValue, maxValue }),
  );

  /** Both ends are reported together, once complete (or cleared). */
  function commit(next: DateRange) {
    value = next;
    if (next.start) placeholder = next.start;
    if (next.start && next.end) onchange?.(next);
  }

  function endField(which: 'start' | 'end') {
    return new FieldState({
      mode: 'date',
      getValue: () => value[which],
      setValue: (v) => {
        const d = v as DateValue | undefined;
        const next = { ...value, [which]: d };
        // typing an end before the start swaps them, like picking in the calendar does
        if (next.start && next.end && next.end.compare(next.start) < 0) {
          commit({ start: next.end, end: next.start });
        } else {
          commit(next);
        }
        if (!d) onchange?.(next);
      },
      getPlaceholder: () => basePlaceholder,
      getLocale: () => locale,
      getGranularity: () => 'day',
      getHourCycle: () => undefined,
      getDisabled: () => disabled,
      getReadonly: () => readonly,
      getMin: () => minValue,
      getMax: () => maxValue,
      getRoot: () => wrap,
      announce,
    });
  }

  const startField = endField('start');
  const endFieldState = endField('end');
  $effect(() => startField.sync(value.start));
  $effect(() => endFieldState.sync(value.end));

  const cal = new CalendarState({
    mode: 'range',
    getValue: () => undefined,
    getRange: () => value,
    getPlaceholder: () => placeholder ?? value.start,
    setPlaceholder: (d) => (placeholder = d),
    commitRange: commit,
    onSelect: () => {
      if (closeOnRangeSelect) close(true);
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
    getLabel: () => label ?? t().calendar.rangeLabel,
    announce,
  });

  function close(restoreFocus = false) {
    open = false;
    if (restoreFocus) triggerEl?.focus();
  }

  /** See DatePicker: focus this popover's own day without scrolling the page. */
  function focusOwnDay(content: HTMLElement) {
    queueMicrotask(() => {
      const day =
        content.querySelector<HTMLElement>('[data-ca-day][data-focused]') ??
        content.querySelector<HTMLElement>('[data-ca-day]:not([data-disabled])');
      day?.focus({ preventScroll: true });
    });
  }
</script>

<div role="group" id={id}>
  <div class="ca-date {className}" class:ca-date--sm={size === 'sm'} class:ca-date--error={!!error} class:ca-date--disabled={disabled}>
    {#if label}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <span class="ca-date__label" id="{id}-label" onclick={() => !disabled && startField.focusFirst()}>
        {label}{#if required}<span class="ca-date__req" aria-hidden="true"> *</span>{/if}
      </span>
    {/if}

    <div
      class="ca-date__wrap"
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      bind:this={wrap}
    >
      <DateSegments
        field={startField}
        base="{id}-s"
        tag="div"
        role="presentation"
        labelId={label ? `${id}-label` : undefined}
        {disabled}
        {readonly}
        invalid={!!error}
      />
      <span class="ca-date__range-sep" aria-hidden="true">–</span>
      <DateSegments
        field={endFieldState}
        base="{id}-e"
        tag="div"
        role="presentation"
        labelId={label ? `${id}-label` : undefined}
        {disabled}
        {readonly}
        invalid={!!error}
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
        <CalendarRange size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>

    {#if error}
      <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
    {:else if description}
      <p id="{id}-hint" class="ca-date__hint">{description}</p>
    {/if}
  </div>
</div>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().calendar.rangeLabel}
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
    <CalendarBody state={cal} {disabled} {readonly} range />
  </div>
</PickerPopover>

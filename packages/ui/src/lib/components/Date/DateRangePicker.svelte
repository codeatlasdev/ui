<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { calendar } from '../../i18n/groups/calendar.js';
  import { CalendarRange } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import CalendarFrame from './CalendarFrame.svelte';
  import { CalendarState } from './calendar-state.svelte.js';
  import DateSegments from './DateSegments.svelte';
  import DateFieldShell from './DateFieldShell.svelte';
  import { defaultDate, focusOwnDay, type WeekStart } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import type { DateRange } from './types.js';
  import './date.css';
  const t = useMessages(calendar);

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
</script>

<DateFieldShell
  range
  {id}
  field={startField}
  {label}
  {description}
  {error}
  {disabled}
  {readonly}
  {required}
  {size}
  class={className}
  {open}
  triggerIcon={CalendarRange}
  triggerLabel={triggerLabel ?? t().calendar.openCalendar}
  bind:triggerEl
  onToggle={() => (open = !open)}
  bind:wrap
>
  {#snippet segments()}
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
  {/snippet}
</DateFieldShell>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().calendar.rangeLabel}
  onclose={() => close()}
  onopen={focusOwnDay}
>
  <CalendarFrame state={cal} {disabled} {readonly} range />
</PickerPopover>

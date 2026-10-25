<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { calendar } from '../../i18n/groups/calendar.js';
  import { CalendarDays } from '@lucide/svelte';
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import { uid } from '../../utils/index.js';
  import CalendarFrame from './CalendarFrame.svelte';
  import { CalendarState } from './calendar-state.svelte.js';
  import DateFieldShell from './DateFieldShell.svelte';
  import { defaultDate, focusOwnDay, type WeekStart } from './date-utils.js';
  import { FieldState } from './field-state.svelte.js';
  import PickerPopover from './PickerPopover.svelte';
  import './date.css';
  const t = useMessages(calendar);

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
  {open}
  triggerIcon={CalendarDays}
  triggerLabel={triggerLabel ?? t().calendar.openCalendar}
  bind:triggerEl
  onToggle={() => (open = !open)}
  {name}
  formValue={value?.toString()}
  bind:wrap
/>

<PickerPopover
  {open}
  anchor={triggerEl}
  trigger={triggerEl}
  id="{id}-content"
  label={label ?? t().calendar.label}
  onclose={() => close()}
  onopen={focusOwnDay}
>
  <CalendarFrame state={cal} {disabled} {readonly} />
</PickerPopover>

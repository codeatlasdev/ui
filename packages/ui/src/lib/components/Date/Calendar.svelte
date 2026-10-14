<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { DateValue } from '@internationalized/date';
  import { announce } from '../../utils/announce.js';
  import CalendarBody from './CalendarBody.svelte';
  import { CalendarState } from './calendar-state.svelte.js';
  import type { WeekStart } from './date-utils.js';
  import './date.css';
  const t = useT();

  interface Props {
    /** Selected date. Bindable. */
    value?:         DateValue;
    /** Controls the visible month when no value is set. Bindable. */
    placeholder?:   DateValue;
    minValue?:      DateValue;
    maxValue?:      DateValue;
    disabled?:      boolean;
    readonly?:      boolean;
    locale?:        string;
    /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    weekStartsOn?:  WeekStart;
    numberOfMonths?: number;
    fixedWeeks?:    boolean;
    isDateDisabled?:    (date: DateValue) => boolean;
    isDateUnavailable?: (date: DateValue) => boolean;
    /** Screen-reader label; the visible month/year is appended automatically. */
    label?:         string;
    onchange?:      (value: DateValue | undefined) => void;
    class?:         string;
  }

  let {
    value        = $bindable(),
    placeholder  = $bindable(),
    minValue,
    maxValue,
    disabled     = false,
    readonly     = false,
    locale       = 'pt-BR',
    weekStartsOn = 1,
    numberOfMonths = 1,
    fixedWeeks   = false,
    isDateDisabled,
    isDateUnavailable,
    label,
    onchange,
    class: className = '',
  }: Props = $props();

  const cal = new CalendarState({
    mode: 'single',
    getValue: () => value,
    getRange: () => ({ start: undefined, end: undefined }),
    getPlaceholder: () => placeholder,
    setPlaceholder: (d) => (placeholder = d),
    commit: (d) => {
      value = d;
      placeholder = d;
      onchange?.(d);
    },
    getMin: () => minValue,
    getMax: () => maxValue,
    getDisabled: () => disabled,
    getReadonly: () => readonly,
    getLocale: () => locale,
    getWeekStartsOn: () => weekStartsOn,
    getNumberOfMonths: () => numberOfMonths,
    getFixedWeeks: () => fixedWeeks,
    getIsDateDisabled: () => isDateDisabled,
    getIsDateUnavailable: () => isDateUnavailable,
    getLabel: () => label ?? t().calendar.label,
    announce,
  });

  // A selected date always drives the visible month.
  $effect(() => {
    if (value && placeholder !== value) placeholder = value;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={cal.root}
  class="ca-cal ca-cal--standalone {className}"
  role="application"
  aria-label={cal.fullLabel}
  data-disabled={disabled ? '' : undefined}
  data-readonly={readonly ? '' : undefined}
  onkeydown={cal.onkeydown}
>
  <div
    style="border:0;clip:rect(0,0,0,0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px"
  ><div role="heading" aria-level="2">{cal.fullLabel}</div></div>
  <CalendarBody state={cal} {disabled} {readonly} />
</div>

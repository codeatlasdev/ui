<script lang="ts">
  import { untrack } from 'svelte';
  import { CalendarDate, type DateValue } from '@internationalized/date';
  import Calendar from './Calendar.svelte';
  import RangeCalendar from './RangeCalendar.svelte';
  import DatePicker from './DatePicker.svelte';
  import DateRangePicker from './DateRangePicker.svelte';
  import DateField from './DateField.svelte';
  import TimeField from './TimeField.svelte';
  import TimePicker from './TimePicker.svelte';
  import MonthPicker from './MonthPicker.svelte';
  import type { DateRange } from './types.js';
  import type { Time } from '@internationalized/date';

  let {
    kind,
    date = $bindable(),
    range = $bindable({ start: undefined, end: undefined }),
    time = $bindable(),
    minValue,
    timeMin,
    placeholder = new CalendarDate(2026, 3, 10),
    ...rest
  }: {
    kind: 'calendar' | 'range' | 'picker' | 'rangepicker' | 'field' | 'time' | 'timepicker' | 'monthpicker';
    date?: DateValue;
    range?: DateRange;
    time?: Time;
    minValue?: DateValue;
    timeMin?: Time;
    placeholder?: DateValue;
    [k: string]: unknown;
  } = $props();

  // MonthPicker holds a CalendarDate; `date` seeds it (the other pickers take any DateValue).
  let monthValue = $state<CalendarDate | undefined>(
    untrack(() => (date instanceof CalendarDate ? date : undefined)),
  );
</script>

{#if kind === 'calendar'}
  <Calendar bind:value={date} {placeholder} {minValue} {...rest} />
{:else if kind === 'range'}
  <RangeCalendar bind:value={range} {placeholder} {minValue} numberOfMonths={1} {...rest} />
{:else if kind === 'picker'}
  <DatePicker label="Date" bind:value={date} {placeholder} {minValue} {...rest} />
{:else if kind === 'rangepicker'}
  <DateRangePicker label="Period" bind:value={range} {placeholder} {minValue} {...rest} />
{:else if kind === 'field'}
  <DateField label="Birth date" bind:value={date} {placeholder} {minValue} {...rest} />
{:else if kind === 'timepicker'}
  <TimePicker label="Time" bind:value={time} minValue={timeMin} {...rest} />
{:else if kind === 'monthpicker'}
  <MonthPicker label="Month" bind:value={monthValue} {minValue} {...rest} />
{:else}
  <TimeField label="Time" bind:value={time} {...rest} />
{/if}

<output data-testid="date">{(kind === 'monthpicker' ? monthValue : date)?.toString() ?? ''}</output>
<output data-testid="start">{range.start?.toString() ?? ''}</output>
<output data-testid="end">{range.end?.toString() ?? ''}</output>
<output data-testid="time">{time?.toString() ?? ''}</output>

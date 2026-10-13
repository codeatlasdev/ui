<script lang="ts">
  import { CalendarDate, type DateValue } from '@internationalized/date';
  import Calendar from './Calendar.svelte';
  import RangeCalendar from './RangeCalendar.svelte';
  import DatePicker from './DatePicker.svelte';
  import DateRangePicker from './DateRangePicker.svelte';
  import DateField from './DateField.svelte';
  import TimeField from './TimeField.svelte';
  import type { DateRange } from './types.js';
  import type { Time } from '@internationalized/date';

  let {
    kind,
    date = $bindable(),
    range = $bindable({ start: undefined, end: undefined }),
    time = $bindable(),
    minValue,
    placeholder = new CalendarDate(2026, 3, 10),
    ...rest
  }: {
    kind: 'calendar' | 'range' | 'picker' | 'rangepicker' | 'field' | 'time';
    date?: DateValue;
    range?: DateRange;
    time?: Time;
    minValue?: DateValue;
    placeholder?: DateValue;
    [k: string]: unknown;
  } = $props();
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
{:else}
  <TimeField label="Time" bind:value={time} {...rest} />
{/if}

<output data-testid="date">{date?.toString() ?? ''}</output>
<output data-testid="start">{range.start?.toString() ?? ''}</output>
<output data-testid="end">{range.end?.toString() ?? ''}</output>
<output data-testid="time">{time?.toString() ?? ''}</output>

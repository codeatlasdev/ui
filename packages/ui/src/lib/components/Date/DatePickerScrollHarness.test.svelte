<script lang="ts">
  import { CalendarDate, type DateValue } from '@internationalized/date';
  import Calendar from './Calendar.svelte';
  import DatePicker from './DatePicker.svelte';
  import DateRangePicker from './DateRangePicker.svelte';
  import RangeCalendar from './RangeCalendar.svelte';
  import type { DateRange } from './types.js';

  let { range = false }: { range?: boolean } = $props();
  const placeholder = new CalendarDate(2026, 3, 10);
  let pickerValue = $state<DateValue | undefined>();
  let rangeValue = $state<DateRange>({ start: undefined, end: undefined });
  let calValue = $state<DateValue | undefined>(new CalendarDate(2026, 10, 10));
  let calRange = $state<DateRange>({ start: undefined, end: undefined });
</script>

<!-- Mirrors the showcase page: pickers first, long page, inline calendars at the bottom. -->
<div style="height: 200px"></div>
{#if range}
  <DateRangePicker label="Period" {placeholder} bind:value={rangeValue} />
{:else}
  <DatePicker label="Date" {placeholder} bind:value={pickerValue} />
{/if}
<div style="height: 1500px"></div>
<Calendar label="Event" bind:value={calValue} />
<RangeCalendar label="Window" bind:value={calRange} />

<output data-testid="picker">{pickerValue?.toString() ?? ''}</output>
<output data-testid="rstart">{rangeValue.start?.toString() ?? ''}</output>
<output data-testid="rend">{rangeValue.end?.toString() ?? ''}</output>
<output data-testid="cal">{calValue?.toString() ?? ''}</output>

<script lang="ts">
  import {
    Calendar,
    RangeCalendar,
    getLocalTimeZone,
    today,
    type DateRange,
    type DateValue,
  } from '@codeatlasdev/ui';

  let value = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let range = $state<DateRange>({ start: undefined, end: undefined });

  const fmt = (d: DateValue | undefined) => (d ? d.toString() : '–');
</script>

<div class="stack">
  <Calendar bind:value label="Event date" locale="en-US" weekStartsOn={0} />
  <p class="out">value: <code>{fmt(value)}</code></p>
</div>

<div class="stack">
  <RangeCalendar bind:value={range} label="Stay" locale="en-US" weekStartsOn={0} numberOfMonths={1} />
  <p class="out">start: <code>{fmt(range.start)}</code> · end: <code>{fmt(range.end)}</code></p>
</div>

<style>
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    /* A flex item defaults to min-width: auto and would grow to the calendar's content; with 0 the
       calendar's max-width: 100% holds and its month grid scrolls inside it on narrow phones. */
    min-width: 0;
  }

  .out {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>

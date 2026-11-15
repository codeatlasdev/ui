<script lang="ts">
  import {
    Calendar,
    RangeCalendar,
    getLocalTimeZone,
    today,
    type DateRange,
    type DateValue,
  } from '@codeatlasdev/ui';

  let day = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let stay = $state<DateRange>({ start: undefined, end: undefined });

  const fmt = (d: DateValue | undefined) => (d ? d.toString() : '–');
</script>

<div class="col">
  <Calendar bind:value={day} fill label="Appointment day" locale="en-US" weekStartsOn={0} />
  <p class="out">value: <code>{fmt(day)}</code></p>

  <RangeCalendar bind:value={stay} fill label="Stay" locale="en-US" weekStartsOn={0} />
  <p class="out">start: <code>{fmt(stay.start)}</code> · end: <code>{fmt(stay.end)}</code></p>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    width: 100%;
  }

  .out {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>

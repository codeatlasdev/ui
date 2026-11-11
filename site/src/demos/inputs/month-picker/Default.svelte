<script lang="ts">
  import { CalendarDate, MonthPicker } from '@codeatlasdev/ui';

  let billing = $state<CalendarDate | undefined>(new CalendarDate(2026, 3, 1));
  let report = $state<CalendarDate | undefined>();
</script>

<div class="col">
  <MonthPicker label="Billing month" locale="en-US" bind:value={billing} />
  <p class="out">value: <code>{billing ? billing.toString() : '–'}</code></p>

  <MonthPicker
    label="Report month"
    description="Only 2026 is available."
    locale="en-US"
    minValue={new CalendarDate(2026, 1, 1)}
    maxValue={new CalendarDate(2026, 12, 31)}
    bind:value={report}
  />
  <p class="out">value: <code>{report ? report.toString() : '–'}</code></p>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    width: 100%;
    max-width: 400px;
  }

  .out {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>

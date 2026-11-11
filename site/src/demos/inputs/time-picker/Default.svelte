<script lang="ts">
  import { Time, TimePicker } from '@codeatlasdev/ui';

  let start = $state<Time | undefined>(new Time(9, 0));
  let end = $state<Time | undefined>();
</script>

<div class="col">
  <TimePicker label="Opens at" locale="en-US" hourCycle={12} bind:value={start} />
  <p class="out">value: <code>{start ? start.toString() : '–'}</code></p>

  <TimePicker
    label="Closes at"
    description="Between 12:00 and 20:00, every 30 minutes."
    locale="en-US"
    hourCycle={24}
    step={30}
    minValue={new Time(12, 0)}
    maxValue={new Time(20, 0)}
    bind:value={end}
  />
  <p class="out">value: <code>{end ? end.toString() : '–'}</code></p>
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

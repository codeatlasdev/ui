<script lang="ts">
  import { Popover, Button, Calendar, getLocalTimeZone, today, type DateValue } from '@codeatlasdev/ui';

  let open = $state(false);
  let value = $state<DateValue | undefined>(today(getLocalTimeZone()));
</script>

<Popover bind:open align="start">
  {#snippet triggerChild(props)}
    <Button {...props}>{value ? value.toString() : 'Pick a date'}</Button>
  {/snippet}
  {#snippet children({ close })}
    <Calendar bind:value label="Due date" locale="en-US" weekStartsOn={0} onchange={() => close()} />
  {/snippet}
</Popover>

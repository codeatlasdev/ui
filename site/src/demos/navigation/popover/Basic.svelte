<script lang="ts">
  import { Popover, Button, Stack } from '@codeatlasdev/ui';
</script>

<Popover>
  {#snippet triggerChild(props)}<Button {...props}>Open popover</Button>{/snippet}
  <Stack gap="3">
    <p class="text">This is a basic popover with some content inside.</p>
    <Button size="sm" variant="filled">Confirm</Button>
  </Stack>
</Popover>

<style>
  .text { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import { StickyActions, Button, TextField, Stack } from '@codeatlasdev/ui';

  let name = $state('');
  const dirty = $derived(name.length > 0);
</script>

<div class="scroller">
  <Stack gap="4">
    <TextField label="Name" bind:value={name} placeholder="Type to reveal the bar" />
    <div class="filler">Long content…</div>
  </Stack>
  <StickyActions show={dirty}>
    <Button variant="ghost" onclick={() => (name = '')}>Cancel</Button>
    <Button variant="filled">Save</Button>
  </StickyActions>
</div>

<style>
  .scroller { width: 100%; max-height: 280px; overflow-y: auto; padding: 0 var(--ca-space-4); }
  .filler { height: 320px; color: var(--ca-text-secondary); }
</style>

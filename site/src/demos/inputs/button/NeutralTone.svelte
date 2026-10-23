<script lang="ts">
  import { Button, IconButton } from '@codeatlasdev/ui';
  import { MoreHorizontal } from '@lucide/svelte';
</script>

<div class="row">
  <Button variant="filled">Send reply</Button>
  <Button variant="outlined" tone="neutral">Edit message</Button>
  <Button variant="ghost" tone="neutral" size="sm">Snooze</Button>
  <IconButton variant="outlined" tone="neutral" aria-label="More actions">
    <MoreHorizontal size={18} />
  </IconButton>
</div>

<style>
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
</style>

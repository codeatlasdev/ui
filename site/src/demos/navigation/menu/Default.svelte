<script lang="ts">
  import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Button } from '@codeatlasdev/ui';
  import { Edit2, Copy, Trash2, Download } from '@lucide/svelte';

  let last = $state('');
</script>

<DropdownMenu>
  {#snippet triggerChild(props)}
    <Button variant="glass" {...props}>Open menu</Button>
  {/snippet}
  <DropdownMenuLabel>File actions</DropdownMenuLabel>
  <DropdownMenuItem onclick={() => (last = 'Edit')}>
    {#snippet icon()}<Edit2 />{/snippet}
    Edit
  </DropdownMenuItem>
  <DropdownMenuItem onclick={() => (last = 'Duplicate')}>
    {#snippet icon()}<Copy />{/snippet}
    Duplicate
  </DropdownMenuItem>
  <DropdownMenuItem onclick={() => (last = 'Download')}>
    {#snippet icon()}<Download />{/snippet}
    Download
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive" onclick={() => (last = 'Delete')}>
    {#snippet icon()}<Trash2 />{/snippet}
    Delete
  </DropdownMenuItem>
</DropdownMenu>

{#if last}<span class="note" aria-live="polite">Last action: {last}</span>{/if}

<style>
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import {
    announce,
    ContextMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
  } from '@codeatlasdev/ui';

  let last = $state('');
  let pinned = $state(false);

  function pick(action: string) {
    last = action;
    announce(`Last action: ${action}`);
  }
</script>

<ContextMenu class="area" role="group" aria-label="Project file">
  <span>quarterly-report.pdf. Right-click, long-press, or focus it and press Shift+F10.</span>
  {#snippet menu()}
    <DropdownMenuItem onclick={() => pick('Rename')}>Rename</DropdownMenuItem>
    <DropdownMenuCheckboxItem bind:checked={pinned}>Pinned</DropdownMenuCheckboxItem>
    <DropdownMenuSub>
      {#snippet trigger()}<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>{/snippet}
      <DropdownMenuItem onclick={() => pick('Move to Archive')}>Archive</DropdownMenuItem>
      <DropdownMenuItem onclick={() => pick('Move to Shared')}>Shared</DropdownMenuItem>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onclick={() => pick('Delete')}>Delete</DropdownMenuItem>
  {/snippet}
</ContextMenu>

<span class="note">Pinned: {pinned ? 'yes' : 'no'}{last ? `. Last action: ${last}` : ''}</span>

<style>
  :global(.area) {
    display: grid;
    place-items: center;
    min-block-size: 8rem;
    padding: var(--ca-space-4);
    border: var(--ca-border-width) dashed var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
    text-align: center;
  }
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import { ContextMenu, DropdownMenuItem, DropdownMenuLabel } from '@codeatlasdev/ui';

  const rows = ['Invoice 1042', 'Invoice 1043', 'Invoice 1044'];
  let last = $state('');
</script>

<ul class="rows">
  {#each rows as row (row)}
    <li>
      <ContextMenu class="row" role="group" aria-label={row} longPressDelay={400}>
        <span>{row}</span>
        {#snippet menu()}
          <DropdownMenuLabel>{row}</DropdownMenuLabel>
          <DropdownMenuItem onclick={() => (last = `Open ${row}`)}>Open</DropdownMenuItem>
          <DropdownMenuItem onclick={() => (last = `Send ${row}`)}>Send reminder</DropdownMenuItem>
        {/snippet}
      </ContextMenu>
    </li>
  {/each}
</ul>
<span class="note">{last ? `Last action: ${last}` : 'Tab to a row and press Shift+F10, or long-press on touch.'}</span>

<style>
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-1); }
  :global(.row) {
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }
  :global(.row:hover), :global(.row[data-state='open']) { background: var(--ca-action-hover); }
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

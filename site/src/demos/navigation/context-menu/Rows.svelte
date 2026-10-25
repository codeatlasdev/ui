<script lang="ts">
  import { ContextMenu, DropdownMenuItem, DropdownMenuLabel } from '@codeatlasdev/ui';

  const rows = ['Invoice 1042', 'Invoice 1043', 'Invoice 1044'];
  let last = $state('');
</script>

<ul class="cm-rows">
  {#each rows as row (row)}
    <li>
      <ContextMenu class="cm-row" role="group" aria-label={row} longPressDelay={400}>
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
  .cm-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-1); }
  /* The class goes through ContextMenu's `class` prop onto its own element, so it is reached with
     :global, but only under this demo's list: a bare global `.row` would restyle every other demo's `.row`. */
  .cm-rows :global(.cm-row) {
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }
  .cm-rows :global(.cm-row:hover), .cm-rows :global(.cm-row[data-state='open']) { background: var(--ca-action-hover); }
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

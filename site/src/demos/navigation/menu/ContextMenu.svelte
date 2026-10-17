<script lang="ts">
  import { announce, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@codeatlasdev/ui';

  let open = $state(false);
  let point = $state<{ x: number; y: number } | null>(null);
  let last = $state('');

  function pick(action: string) {
    last = action;
    announce(`Last action: ${action}`);
  }

  function oncontextmenu(e: MouseEvent) {
    e.preventDefault();
    point = { x: e.clientX, y: e.clientY };
    open = true;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10')) return;
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    point = { x: box.left + 16, y: box.top + 16 };
    open = true;
  }
</script>

<button type="button" class="area" {oncontextmenu} {onkeydown}>
  Right-click here, or focus it and press Shift+F10.
</button>

<DropdownMenu bind:open anchor={point}>
  <DropdownMenuItem onclick={() => pick('Rename')}>Rename</DropdownMenuItem>
  <DropdownMenuItem onclick={() => pick('Duplicate')}>Duplicate</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive" onclick={() => pick('Delete')}>Delete</DropdownMenuItem>
</DropdownMenu>

{#if last}<span class="note">Last action: {last}</span>{/if}

<style>
  .area {
    display: grid;
    place-items: center;
    inline-size: 100%;
    min-block-size: 8rem;
    background: none;
    font: inherit;
    cursor: context-menu;
    padding: var(--ca-space-4);
    border: var(--ca-border-width) dashed var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

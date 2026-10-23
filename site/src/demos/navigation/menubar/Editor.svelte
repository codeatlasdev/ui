<script lang="ts">
  import {
    announce,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    Menubar,
    MenubarMenu,
  } from '@codeatlasdev/ui';

  let last = $state('');
  let wrap = $state(true);
  let zoom = $state('100');

  function pick(action: string) {
    last = action;
    announce(`Last action: ${action}`);
  }
</script>

<Menubar aria-label="Editor">
  <MenubarMenu label="File">
    <DropdownMenuItem onclick={() => pick('New file')}>New file</DropdownMenuItem>
    <DropdownMenuItem onclick={() => pick('Open')}>Open</DropdownMenuItem>
    <DropdownMenuSub>
      {#snippet trigger()}<DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>{/snippet}
      <DropdownMenuItem onclick={() => pick('Export PDF')}>PDF</DropdownMenuItem>
      <DropdownMenuItem onclick={() => pick('Export HTML')}>HTML</DropdownMenuItem>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onclick={() => pick('Close')}>Close</DropdownMenuItem>
  </MenubarMenu>
  <MenubarMenu label="Edit">
    <DropdownMenuItem onclick={() => pick('Undo')}>Undo</DropdownMenuItem>
    <DropdownMenuItem onclick={() => pick('Redo')}>Redo</DropdownMenuItem>
  </MenubarMenu>
  <MenubarMenu label="View">
    <DropdownMenuCheckboxItem bind:checked={wrap}>Word wrap</DropdownMenuCheckboxItem>
    <DropdownMenuSeparator />
    <DropdownMenuLabel>Zoom</DropdownMenuLabel>
    <DropdownMenuRadioGroup bind:value={zoom} aria-label="Zoom">
      <DropdownMenuRadioItem value="100">100%</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="150">150%</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </MenubarMenu>
  <MenubarMenu label="Help" disabled>
    <DropdownMenuItem>About</DropdownMenuItem>
  </MenubarMenu>
</Menubar>

<span class="note">Word wrap: {wrap ? 'on' : 'off'}. Zoom: {zoom}%{last ? `. Last action: ${last}` : ''}</span>

<style>
  .note { display: block; margin-block-start: var(--ca-space-3); font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

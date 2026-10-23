<script lang="ts">
  import { DropdownMenuItem, Menubar, MenubarMenu } from '@codeatlasdev/ui';

  let open = $state(false);
</script>

<Menubar aria-label="Document" onOpenChange={(o) => (open = o)}>
  <MenubarMenu label="Share">
    <DropdownMenuItem>Copy link</DropdownMenuItem>
    <DropdownMenuItem>Invite people</DropdownMenuItem>
  </MenubarMenu>
  <MenubarMenu label="Insert">
    <DropdownMenuItem>Table</DropdownMenuItem>
    <DropdownMenuItem>Image</DropdownMenuItem>
  </MenubarMenu>
</Menubar>
<span class="note">A menu is {open ? 'open' : 'closed'}.</span>

<style>
  .note { display: block; margin-block-start: var(--ca-space-3); font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    Button,
  } from '@codeatlasdev/ui';

  let last = $state('');
  const colors = ['Red', 'Green', 'Blue'];
  const groups = ['Inbox', 'Archive', 'Projects'];
</script>

<DropdownMenu>
  {#snippet triggerChild(props)}
    <Button variant="glass" {...props}>Item actions</Button>
  {/snippet}
  <DropdownMenuItem onclick={() => (last = 'Rename')}>Rename</DropdownMenuItem>
  <DropdownMenuSub>
    {#snippet trigger()}<DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>{/snippet}
    {#each colors as color}
      <DropdownMenuItem onclick={() => (last = `Color ${color}`)}>{color}</DropdownMenuItem>
    {/each}
  </DropdownMenuSub>
  <DropdownMenuSub>
    {#snippet trigger()}<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>{/snippet}
    {#each groups as group}
      <DropdownMenuItem onclick={() => (last = `Moved to ${group}`)}>{group}</DropdownMenuItem>
    {/each}
  </DropdownMenuSub>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive" onclick={() => (last = 'Delete')}>Delete</DropdownMenuItem>
</DropdownMenu>

{#if last}<span class="note" aria-live="polite">Last action: {last}</span>{/if}

<style>
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

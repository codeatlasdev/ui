<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    Button,
  } from '@codeatlasdev/ui';

  let showHidden = $state(false);
  let showPreview = $state(true);
  let sort = $state('name');
</script>

<DropdownMenu>
  {#snippet triggerChild(props)}
    <Button variant="glass" {...props}>View options</Button>
  {/snippet}
  <DropdownMenuCheckboxItem bind:checked={showHidden}>Show hidden files</DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem bind:checked={showPreview}>Show preview</DropdownMenuCheckboxItem>
  <DropdownMenuSeparator />
  <DropdownMenuRadioGroup bind:value={sort} aria-label="Sort by">
    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
    <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="date">Date modified</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>
</DropdownMenu>

<span class="note" aria-live="polite">
  Sorted by {sort}. Hidden files {showHidden ? 'shown' : 'hidden'}, preview {showPreview ? 'on' : 'off'}.
</span>

<style>
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import {
    Button,
    ButtonGroup,
    DropdownMenu,
    DropdownMenuItem,
    IconButton,
  } from '@codeatlasdev/ui';
  import { ChevronDown, ChevronLeft, ChevronRight } from '@lucide/svelte';
</script>

<div class="row">
  <ButtonGroup aria-label="Publish">
    <Button variant="filled">Publish</Button>
    <DropdownMenu align="end">
      {#snippet triggerChild(props)}
        <IconButton variant="filled" aria-label="More publish options" {...props}><ChevronDown size={16} /></IconButton>
      {/snippet}
      <DropdownMenuItem>Schedule</DropdownMenuItem>
      <DropdownMenuItem>Save as draft</DropdownMenuItem>
    </DropdownMenu>
  </ButtonGroup>

  <ButtonGroup aria-label="Pages" orientation="vertical">
    <IconButton variant="outlined" tone="neutral" aria-label="Previous page"><ChevronLeft size={16} /></IconButton>
    <IconButton variant="outlined" tone="neutral" aria-label="Next page"><ChevronRight size={16} /></IconButton>
  </ButtonGroup>
</div>

<style>
  .row { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--ca-space-6); }
</style>

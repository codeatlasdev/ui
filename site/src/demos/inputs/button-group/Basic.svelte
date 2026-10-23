<script lang="ts">
  import { Button, ButtonGroup, IconButton } from '@codeatlasdev/ui';
  import { Bold, Italic, Underline } from '@lucide/svelte';
</script>

<div class="col">
  <ButtonGroup aria-label="View range">
    <Button variant="outlined" tone="neutral">Day</Button>
    <Button variant="outlined" tone="neutral">Week</Button>
    <Button variant="outlined" tone="neutral">Month</Button>
  </ButtonGroup>

  <ButtonGroup aria-label="Text style">
    <IconButton variant="outlined" tone="neutral" aria-label="Bold"><Bold size={16} /></IconButton>
    <IconButton variant="outlined" tone="neutral" aria-label="Italic"><Italic size={16} /></IconButton>
    <IconButton variant="outlined" tone="neutral" aria-label="Underline"><Underline size={16} /></IconButton>
  </ButtonGroup>

  <ButtonGroup aria-label="Review">
    <Button variant="filled">Approve</Button>
    <Button variant="destructive">Reject</Button>
  </ButtonGroup>
</div>

<style>
  .col { display: grid; gap: var(--ca-space-3); justify-items: start; }
</style>

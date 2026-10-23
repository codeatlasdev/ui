<script lang="ts">
  import { Button, HoverCard } from '@codeatlasdev/ui';

  let open = $state(false);
  let log = $state('closed');

  function onOpenChange(o: boolean) {
    log = o ? 'opened by the user' : 'closed by the user';
  }
</script>

<div class="row">
  <HoverCard bind:open openDelay={150} closeDelay={150} side="top" align="start" {onOpenChange}>
    {#snippet triggerChild(props)}<Button variant="outlined" {...props}>Plan details</Button>{/snippet}
    <p class="text">Team plan: 10 seats, 100 GB storage, priority support.</p>
  </HoverCard>
  <Button variant="ghost" onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'} from code</Button>
</div>
<span class="note">State: {log}</span>

<style>
  .row { display: flex; gap: var(--ca-space-3); align-items: center; flex-wrap: wrap; }
  .text { margin: 0; color: var(--ca-text-secondary); }
  .note { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

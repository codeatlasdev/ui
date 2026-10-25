<script lang="ts">
  import { Button, Dialog, DropdownMenu, DropdownMenuItem, DropdownMenuLabel, ThemeIsland } from '@codeatlasdev/ui';

  let open = $state(true);
  let last = $state('Nothing picked yet');
</script>

<ThemeIsland scheme="dark" preset="ocean" class="island">
  <div class="bar">
    <Button size="sm" onclick={() => (open = !open)}>{open ? 'Close' : 'Open'} dialog</Button>
    <DropdownMenu inline>
      {#snippet triggerChild(props)}
        <Button size="sm" variant="outlined" {...props}>Environment</Button>
      {/snippet}
      <DropdownMenuLabel>Deploy to</DropdownMenuLabel>
      <DropdownMenuItem onclick={() => (last = 'Staging')}>Staging</DropdownMenuItem>
      <DropdownMenuItem onclick={() => (last = 'Production')}>Production</DropdownMenuItem>
    </DropdownMenu>
    <span class="note">{last}</span>
  </div>
  <!-- The dialog is absolutely positioned inside this region: a stage of its own, below the controls, so nothing overlaps. -->
  <div class="stage">
    <Dialog
      inline
      bind:open
      size="sm"
      title="Publish release 4.6.0?"
      description="This dialog is inside the box, wearing the box's own theme."
    >
      {#snippet actions()}
        <Button size="sm" variant="outlined" onclick={() => (open = false)}>Not yet</Button>
        <Button size="sm" onclick={() => (open = false)}>Publish</Button>
      {/snippet}
    </Dialog>
  </div>
</ThemeIsland>

<style>
  :global(.island) {
    inline-size: min(100%, 28rem);
    border: var(--ca-border-width) solid var(--ca-outline-default);
    border-radius: var(--ca-radius-md);
    overflow: hidden;
  }
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); padding: var(--ca-space-3) var(--ca-space-4); }
  .stage { position: relative; min-block-size: 15rem; }
  .note { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
</style>

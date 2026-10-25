<script lang="ts">
  import { Button, Dialog, Tooltip, layers } from '@codeatlasdev/ui';

  let open = $state(false);
</script>

<div class="col">
  <div class="row">
    <Tooltip content="Copies a link to this release" delay={150}>
      {#snippet triggerChild(props)}
        <Button variant="outlined" {...props}>Hover me</Button>
      {/snippet}
    </Tooltip>
    <Button onclick={() => (open = true)}>Open dialog</Button>
  </div>
  <p class="state" aria-live="polite">Modal open: {layers.modalOpen ? 'yes' : 'no'}</p>
  <p class="hint">
    Hover the first button: a tooltip opens. Open the dialog, then try hovering again: nothing opens under it.
    This is the real top-layer dialog.
  </p>
</div>

<Dialog bind:open size="sm" title="Rename release" description="The page behind is inert, so hover panels stay closed.">
  {#snippet actions()}
    <Button onclick={() => (open = false)}>Done</Button>
  {/snippet}
</Dialog>

<style>
  .col { display: grid; gap: var(--ca-space-3); }
  .row { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); }
  .state { margin: 0; font-family: var(--ca-font-mono); font-size: var(--ca-font-size-body2); color: var(--ca-text-primary); }
  .hint { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  // The real overlays, rendered with `inline`: each stays inside its stage (no top layer, no move to
  // <body>), so it takes the tokens of this island and the page behind it stays usable.
  import {
    Alert, Button, Dialog, Drawer, DropdownMenu, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, Heading, Popover, Sheet, TextField, Toaster, toast,
  } from '@codeatlasdev/ui';
  import { Copy, Pencil, Share, Trash } from '@lucide/svelte';

  let name = $state('Q4 launch review');
  let dialog = $state(false);
  let drawer = $state(false);
  let sheet = $state(false);
  let menu = $state(true);
  let popover = $state(true);

  $effect(() => {
    const id = toast.success('Review sent', { description: 'Ana will be notified.', duration: 0, action: { label: 'Undo', onClick: () => {} } });
    return () => toast.remove(id);
  });
</script>

<section class="ts-ov" aria-label="Overlays preview">
  <div class="ts-ov__bar">
    <Button size="sm" variant="outlined" onclick={() => (dialog = true)}>Dialog</Button>
    <Button size="sm" variant="outlined" onclick={() => (drawer = true)}>Drawer</Button>
    <Button size="sm" variant="outlined" onclick={() => (sheet = true)}>Sheet</Button>
    <Button size="sm" variant="outlined" onclick={() => toast.info('Saved to drafts', 4000)}>Toast</Button>
  </div>

  <div class="ts-ov__stage ts-ov__stage--anchored">
    <div class="ts-ov__page">
      <Alert severity="warning" title="Unsaved changes">Your edits will be lost if you leave this page.</Alert>
      <Heading level={3} size="h6">Menu and popover</Heading>
      <div class="ts-ov__row">
        <DropdownMenu inline bind:open={menu} side="bottom" align="start">
          {#snippet trigger()}Review actions{/snippet}
          <DropdownMenuLabel>Review</DropdownMenuLabel>
          <DropdownMenuItem>
            {#snippet icon()}<Pencil size={16} />{/snippet}
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem>
            {#snippet icon()}<Copy size={16} />{/snippet}
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>
            {#snippet icon()}<Share size={16} />{/snippet}
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            {#snippet icon()}<Trash size={16} />{/snippet}
            Delete
          </DropdownMenuItem>
        </DropdownMenu>

        <Popover inline bind:open={popover} side="right" align="start" sideOffset={12}>
          {#snippet trigger()}Share this review{/snippet}
          <Heading level={4} size="h6">Share this review</Heading>
          <p class="ts-ov__body">Anyone in your workspace can view it.</p>
          <Button size="sm" variant="outlined">Copy link</Button>
        </Popover>
      </div>
    </div>
    <Toaster inline />
  </div>

  <div class="ts-ov__stage ts-ov__stage--panels">
    <Dialog inline bind:open={dialog} title="Rename review" description="Everyone with access will see the new name.">
      <TextField label="Review name" bind:value={name} />
      {#snippet actions()}
        <Button variant="ghost" onclick={() => (dialog = false)}>Cancel</Button>
        <Button onclick={() => (dialog = false)}>Save name</Button>
      {/snippet}
    </Dialog>
    <Drawer inline bind:open={drawer} title="Filters" side="right">
      <p class="ts-ov__body">Narrow the list by owner, status or date.</p>
    </Drawer>
    <Sheet inline bind:open={sheet} title="Switch session" description="Choose the active account">
      <p class="ts-ov__body">Ana Souza, Bruno Lima</p>
    </Sheet>
  </div>
</section>

<style>
  .ts-ov {
    display: grid;
    gap: var(--ca-space-3);
    padding: var(--ca-space-4);
    min-width: 0;
  }
  .ts-ov__bar { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
  /* The containing block of every inline overlay: they are absolute inside it, so it is the "viewport" of the demo. */
  .ts-ov__stage {
    position: relative;
    min-height: 26rem;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
    min-width: 0;
  }
  .ts-ov__stage--panels { min-height: 30rem; background: var(--ca-surface-base); }
  .ts-ov__page { display: grid; gap: var(--ca-space-3); padding: var(--ca-space-4); align-content: start; }
  .ts-ov__row { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--ca-space-4); min-height: 12rem; }
  .ts-ov__body { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>

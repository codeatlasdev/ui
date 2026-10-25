<script lang="ts">
  // Overlays rendered statically, in flow, so they can be themed and inspected without a portal.
  // `Dialog` (native <dialog>), `FloatingLayer` (popover API) and `Toaster` (fixed stack) only open
  // in the top layer, so their panels are rebuilt here from the same public `ca-*` classes. The
  // dialog header/body/actions, the dropdown items and the popover/tooltip content are the real
  // classes; the toast has no shareable class (its CSS is scoped to ToastItem), so `ts-toast`
  // mirrors its tokens.
  import {
    Alert, Button, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, Heading,
    TextField,
  } from '@codeatlasdev/ui';
  import { CheckCircle, Copy, Pencil, Share, Trash, X } from '@lucide/svelte';

  let name = $state('Q4 launch review');
</script>

<section class="ts-ov" aria-label="Overlays preview">
  <div class="ts-ov__cell ts-ov__cell--wide">
    <Heading level={3} size="h6">Dialog</Heading>
    <div class="ts-ov__scrim">
      <section class="ts-dialog" aria-labelledby="ts-dialog-title">
        <div class="ca-dialog__header">
          <h4 id="ts-dialog-title" class="ca-dialog__title">Rename review</h4>
          <button type="button" class="ca-layer-close" aria-label="Close preview dialog">
            <X size={16} />
          </button>
        </div>
        <p class="ca-dialog__description">Everyone with access will see the new name.</p>
        <div class="ca-dialog__body">
          <TextField label="Review name" bind:value={name} />
        </div>
        <div class="ca-dialog__actions">
          <Button variant="ghost">Cancel</Button>
          <Button>Save name</Button>
        </div>
      </section>
    </div>
  </div>

  <div class="ts-ov__cell">
    <Heading level={3} size="h6">Menu</Heading>
    <div class="ca-dropdown-content glass-overlay ts-menu" role="menu" aria-label="Review actions">
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
    </div>
  </div>

  <div class="ts-ov__cell">
    <Heading level={3} size="h6">Toast</Heading>
    <div class="ts-toast" role="status">
      <CheckCircle size={18} class="ts-toast__icon" aria-hidden="true" />
      <div class="ts-toast__body">
        <span>Review sent</span>
        <span class="ts-toast__desc">Ana will be notified.</span>
        <button type="button" class="ts-toast__action">Undo</button>
      </div>
      <button type="button" class="ts-toast__close" aria-label="Dismiss preview toast">
        <X size={14} />
      </button>
    </div>
  </div>

  <div class="ts-ov__cell">
    <Heading level={3} size="h6">Alert</Heading>
    <Alert severity="warning" title="Unsaved changes">Your edits will be lost if you leave this page.</Alert>
  </div>

  <div class="ts-ov__cell">
    <Heading level={3} size="h6">Popover and tooltip</Heading>
    <div class="ts-ov__stack">
      <div class="ca-popover-content glass-overlay ts-popover">
        <Heading level={4} size="h6">Share this review</Heading>
        <p class="ts-popover__body">Anyone in your workspace can view it.</p>
        <Button size="sm" variant="outlined">Copy link</Button>
      </div>
      <div class="ca-tooltip-content" role="presentation">Copy a link to this review</div>
    </div>
  </div>
</section>

<style>
  .ts-ov {
    display: grid;
    gap: var(--ca-space-5);
    padding: var(--ca-space-4);
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
  }
  @container ts-island (min-width: 720px) {
    .ts-ov { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ts-ov__cell--wide { grid-column: 1 / -1; }
  }
  .ts-ov__cell { display: grid; align-content: start; gap: var(--ca-space-2); min-width: 0; }
  .ts-ov__stack { display: grid; justify-items: start; gap: var(--ca-space-3); min-width: 0; }

  .ts-ov__scrim {
    display: grid;
    place-items: center;
    padding: var(--ca-space-6) var(--ca-space-4);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-scrim-color);
    min-width: 0;
  }
  .ts-dialog {
    width: 100%;
    max-width: 30rem;
    display: flex;
    flex-direction: column;
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-xl);
    box-shadow: var(--ca-shadow-xl);
    overflow: hidden;
  }

  .ts-menu { width: 100%; max-width: 15rem; }
  .ts-popover { max-width: 18rem; display: grid; gap: var(--ca-space-2); justify-items: start; }
  .ts-popover__body { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }

  .ts-toast {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2-5);
    padding: var(--ca-space-3) var(--ca-space-4);
    border-radius: var(--ca-radius-md);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-left: var(--ca-border-width-strong) solid var(--ca-semantic-success);
    background: var(--ca-glass-bg);
    box-shadow: var(--ca-shadow-md);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    max-width: 24rem;
    min-width: 0;
  }
  .ts-toast :global(.ts-toast__icon) { flex: none; color: var(--ca-semantic-success); }
  .ts-toast__body { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: var(--ca-space-0-5); }
  .ts-toast__desc { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .ts-toast__action {
    margin-top: var(--ca-space-1);
    padding: var(--ca-space-0-5) 0;
    background: none;
    border: none;
    font: inherit;
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
    text-decoration: underline;
    text-underline-offset: var(--ca-space-0-5);
    cursor: pointer;
  }
  .ts-toast__close {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--ca-text-hint);
    padding: var(--ca-space-0-5);
    border-radius: var(--ca-radius-xs);
  }
  .ts-toast__close:hover { color: var(--ca-text-primary); }
</style>

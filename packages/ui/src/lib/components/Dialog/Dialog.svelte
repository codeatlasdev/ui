<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { Dialog } from 'bits-ui';
  import { X } from '@lucide/svelte';
  import './dialog.css';
  import { devWarn } from '../../utils/dev-warn.js';

  /**
   * Dialog: second-layer modal.
   *
   * Architecture:
   *   overlay  → backdrop-filter blur(8px) + dark scrim over the page
   *   panel    → solid surface (--ca-surface-overlay) + strong shadow
   *
   * The panel does NOT use glass/blur: it sits on top of the already darkened overlay.
   * Blurring there would capture the scrim and look flat grey.
   *
   * Usage:
   *   <Dialog bind:open title="Confirm" description="This cannot be undone.">
   *     {#snippet actions()}
   *       <Button variant="outlined" onclick={() => open = false}>Cancel</Button>
   *       <Button variant="destructive" onclick={confirm}>Delete</Button>
   *     {/snippet}
   *   </Dialog>
   */

  interface Props {
    open?:         boolean;
    title?:        string;
    description?:  string;
    /** 'sm' = 400px | 'md' = 480px (default) | 'lg' = 600px | 'xl' = 820px | 'split' = 1100×720 two-column */
    size?:         'sm' | 'md' | 'lg' | 'xl' | 'split';
    /** Omits header, description and actions; body has no padding. Pass `title` for the accessible name (visually hidden). */
    chromeless?:   boolean;
    class?:        string;
    children?:     Snippet;
    actions?:      Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open        = $bindable(false),
    title,
    description,
    size        = 'md',
    chromeless  = false,
    class: className = '',
    children,
    actions,
    onOpenChange,
  }: Props = $props();

  // bits-ui labels the dialog from Dialog.Title; without `title` it has no accessible name.
  $effect(() => {
    if (open && !title?.trim())
      devWarn('dialog-title', '<Dialog> has no `title`, so the dialog has no accessible name. Pass title (use chromeless to hide the header and keep the label).');
  });

  const maxW = { sm: '400px', md: '480px', lg: '600px', xl: '820px', split: '1100px' } as const;
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="ca-overlay" />
    <Dialog.Content
      class="ca-dialog ca-dialog--{size} {chromeless ? 'ca-dialog--chromeless' : ''} {className}"
      aria-modal="true"
      style="--dialog-max-w:{maxW[size]}"
    >
      {#if chromeless}
        {#if title}
          <Dialog.Title class="ca-dialog__sr-only">{title}</Dialog.Title>
        {/if}
        {#if description}
          <Dialog.Description class="ca-dialog__sr-only">{description}</Dialog.Description>
        {/if}
        <div class="ca-dialog__body">{@render children?.()}</div>
      {:else}
        <div class="ca-dialog__header">
          {#if title}
            <Dialog.Title class="ca-dialog__title">{title}</Dialog.Title>
          {/if}
          <Dialog.Close class="ca-layer-close" aria-label={t().dialog.close}>
            <X size={16} stroke-width={2} />
          </Dialog.Close>
        </div>

        {#if description}
          <Dialog.Description class="ca-dialog__description">{description}</Dialog.Description>
        {/if}

        {#if children}
          <div class="ca-dialog__body">{@render children()}</div>
        {/if}

        {#if actions}
          <div class="ca-dialog__actions">{@render actions()}</div>
        {/if}
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

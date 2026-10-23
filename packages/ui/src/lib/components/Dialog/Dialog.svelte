<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { dialog } from '../../i18n/groups/dialog.js';
  import type { Snippet } from 'svelte';
  import { X } from '@lucide/svelte';
  import './dialog.css';
  import { devWarn } from '../../utils/dev-warn.js';
  import { createPresence } from '../../primitives/index.js';
  import { createIds } from '../../primitives/index.js';
  import { modalLayer } from './modal-layer.js';
  const t = useMessages(dialog);

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
    /**
     * Column template of the `size="split"` body (CSS `grid-template-columns`), e.g. `'2fr 3fr'`.
     * Default `'1fr 1fr'`. Sets `--ca-dialog-split-columns`.
     */
    splitColumns?: string;
    /**
     * Panel box of `size="split"`, any CSS length: `{ width: 'min(66vw, 80rem)', height: 'min(88svh, 56rem)' }`.
     * Default 1100×720, capped to the viewport. Sets `--ca-dialog-split-width` / `--ca-dialog-split-height`.
     */
    splitSize?:    { width?: string; height?: string };
    /**
     * Full screen below this breakpoint (`'sm'` = 600px, `'md'` = 900px), any `size`: exactly the
     * viewport (`--ca-vh`), square corners, safe-area padding kept. Focus trap and Escape are unchanged.
     */
    fullscreenBelow?: 'sm' | 'md';
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
    splitColumns,
    splitSize,
    fullscreenBelow,
    class: className = '',
    children,
    actions,
    onOpenChange,
  }: Props = $props();

  // The panel is labelled by its title; without `title` it has no accessible name.
  $effect(() => {
    if (open && !title?.trim())
      devWarn('dialog-title', '<Dialog> has no `title`, so the dialog has no accessible name. Pass title (use chromeless to hide the header and keep the label).');
  });

  const maxW = { sm: '400px', md: '480px', lg: '600px', xl: '820px', split: 'none' } as const;

  const uid = $props.id();
  const ids = createIds(uid);
  const presence = createPresence(() => open);

  function change(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }
</script>

{#if presence.present}
  <!-- An explicit role keeps `[role="dialog"]` selectors (and every engine) seeing the dialog. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <dialog
    class="ca-overlay ca-dialog ca-dialog--{size} {chromeless ? 'ca-dialog--chromeless' : ''} {className}"
    role="dialog"
    aria-labelledby={title ? ids.part('title') : undefined}
    aria-describedby={description ? ids.part('description') : undefined}
    data-state={open ? 'open' : 'closed'}
    data-fullscreen-below={fullscreenBelow}
    style:--dialog-max-w={maxW[size]}
    style:--ca-dialog-split-columns={splitColumns}
    style:--ca-dialog-split-width={splitSize?.width}
    style:--ca-dialog-split-height={splitSize?.height}
    {@attach presence.ref}
    {@attach modalLayer(() => ({ onDismiss: () => change(false), closing: !open }))}
  >
    {#if chromeless}
      {#if title}
        <h2 id={ids.part('title')} class="ca-sr-only">{title}</h2>
      {/if}
      {#if description}
        <p id={ids.part('description')} class="ca-sr-only">{description}</p>
      {/if}
      <div class="ca-dialog__body">{@render children?.()}</div>
    {:else}
      <div class="ca-dialog__header">
        {#if title}
          <h2 id={ids.part('title')} class="ca-dialog__title">{title}</h2>
        {/if}
        <button type="button" class="ca-layer-close" aria-label={t().dialog.close} onclick={() => change(false)}>
          <X size={16} stroke-width={2} />
        </button>
      </div>

      {#if description}
        <p id={ids.part('description')} class="ca-dialog__description">{description}</p>
      {/if}

      {#if children}
        <div class="ca-dialog__body">{@render children()}</div>
      {/if}

      {#if actions}
        <div class="ca-dialog__actions">{@render actions()}</div>
      {/if}
    {/if}
  </dialog>
{/if}

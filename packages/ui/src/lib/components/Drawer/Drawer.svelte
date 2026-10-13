<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { Dialog } from 'bits-ui';
  import { X } from '@lucide/svelte';
  import '../Dialog/dialog.css';

  /**
   * Drawer: side panel, second layer.
   *
   * Same architecture as Dialog:
   *   overlay  → blur(4px) + dark scrim over the page
   *   panel    → solid surface, slides in from the side
   *
   * Usage:
   *   <Drawer bind:open title="Filters" side="right">
   *     …content…
   *   </Drawer>
   */

  interface Props {
    open?:         boolean;
    side?:         'left' | 'right' | 'bottom';
    title?:        string;
    /** Width (left/right). Default: 360px */
    width?:        string;
    class?:        string;
    children?:     Snippet;
    actions?:      Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open      = $bindable(false),
    side      = 'right',
    title,
    width     = '360px',
    class: className = '',
    children,
    actions,
    onOpenChange,
  }: Props = $props();
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="ca-overlay ca-overlay--drawer" />
    <Dialog.Content
      class="ca-drawer ca-drawer--{side} {className}"
      aria-modal="true"
      style="--drawer-w:{width}"
    >
      <div class="ca-drawer__header">
        {#if title}
          <Dialog.Title class="ca-drawer__title">{title}</Dialog.Title>
        {/if}
        <Dialog.Close class="ca-layer-close" aria-label={t().drawer.close}>
          <X size={16} stroke-width={2} />
        </Dialog.Close>
      </div>

      <div class="ca-drawer__body">
        {@render children?.()}
      </div>

      {#if actions}
        <div class="ca-drawer__actions">
          {@render actions()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  /* ca-overlay base lives in Dialog.svelte. Drawer sits below modals; the
     doubled class beats the base .ca-overlay rule regardless of CSS order
     (otherwise the overlay lands above the panel and blurs it). */
  :global(.ca-overlay.ca-overlay--drawer) {
    z-index: var(--ca-z-drawer);
  }

  /* ── Drawer panel ───────────────────────────────────────────── */
  :global(.ca-drawer) {
    position: fixed;
    z-index: calc(var(--ca-z-drawer) + 1);
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: var(--ca-shadow-xl);
  }

  /* ── Side variants ──────────────────────────────────────────── */
  :global(.ca-drawer--right) {
    top: 0; bottom: 0; right: 0;
    width: var(--drawer-w, 360px);
    max-width: calc(100vw - var(--ca-space-12));
    border-radius: var(--ca-radius-xl) 0 0 var(--ca-radius-xl);
    border-right: none;
  }
  :global(.ca-drawer--left) {
    top: 0; bottom: 0; left: 0;
    width: var(--drawer-w, 360px);
    max-width: calc(100vw - var(--ca-space-12));
    border-radius: 0 var(--ca-radius-xl) var(--ca-radius-xl) 0;
    border-left: none;
  }
  :global(.ca-drawer--bottom) {
    bottom: 0; left: 0; right: 0;
    height: auto;
    max-height: calc(var(--ca-vh) * 0.85);
    border-radius: var(--ca-radius-xl) var(--ca-radius-xl) 0 0;
    border-bottom: none;
  }

  /* ── Animations: right ─────────────────────────────────────── */
  :global(.ca-drawer--right[data-state='open']) {
    animation: ca-drawer-right-in var(--ca-duration-base) var(--ca-ease-decelerate) both;
  }
  :global(.ca-drawer--right[data-state='closed']) {
    animation: ca-drawer-right-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  }

  /* ── Animations: left ──────────────────────────────────────── */
  :global(.ca-drawer--left[data-state='open']) {
    animation: ca-drawer-left-in var(--ca-duration-base) var(--ca-ease-decelerate) both;
  }
  :global(.ca-drawer--left[data-state='closed']) {
    animation: ca-drawer-left-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  }

  /* ── Animations: bottom ────────────────────────────────────── */
  :global(.ca-drawer--bottom[data-state='open']) {
    animation: ca-drawer-bottom-in var(--ca-duration-base) var(--ca-ease-decelerate) both;
  }
  :global(.ca-drawer--bottom[data-state='closed']) {
    animation: ca-drawer-bottom-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  }

  /* ── Header ─────────────────────────────────────────────────── */
  :global(.ca-drawer__header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
    padding: var(--ca-space-4) var(--ca-space-5);
    flex-shrink: 0;
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
  }

  :global(.ca-drawer__title) {
    font-size: var(--ca-font-size-body1);
    font-family: var(--ca-font-display);
    font-weight: var(--ca-font-weight-heading);
    letter-spacing: var(--ca-heading-tracking);
    text-transform: var(--ca-heading-case);
    color: var(--ca-text-primary);
    margin: 0;
    flex: 1;
    line-height: var(--ca-line-height-body);
  }

  /* ── Body ───────────────────────────────────────────────────── */
  :global(.ca-drawer__body) {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--ca-space-5);
    min-height: 0;
  }

  /* ── Footer actions ─────────────────────────────────────────── */
  :global(.ca-drawer__actions) {
    display: flex;
    justify-content: flex-end;
    gap: var(--ca-space-2);
    padding: var(--ca-space-3) var(--ca-space-5);
    flex-shrink: 0;
    border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
  }

  /* ── Keyframes ──────────────────────────────────────────────── */
  @keyframes ca-drawer-right-in {
    from { transform: translateX(100%); opacity: 0.6; }
    to   { transform: translateX(0);    opacity: 1;   }
  }
  @keyframes ca-drawer-right-out {
    from { transform: translateX(0);    opacity: 1;   }
    to   { transform: translateX(100%); opacity: 0;   }
  }

  @keyframes ca-drawer-left-in {
    from { transform: translateX(-100%); opacity: 0.6; }
    to   { transform: translateX(0);     opacity: 1;   }
  }
  @keyframes ca-drawer-left-out {
    from { transform: translateX(0);     opacity: 1;   }
    to   { transform: translateX(-100%); opacity: 0;   }
  }

  @keyframes ca-drawer-bottom-in {
    from { transform: translateY(100%); opacity: 0.6; }
    to   { transform: translateY(0);    opacity: 1;   }
  }
  @keyframes ca-drawer-bottom-out {
    from { transform: translateY(0);    opacity: 1;   }
    to   { transform: translateY(100%); opacity: 0;   }
  }
</style>

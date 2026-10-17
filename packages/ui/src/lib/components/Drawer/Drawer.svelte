<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { drawer } from '../../i18n/groups/drawer.js';
  import type { Snippet } from 'svelte';
  import type { HTMLDialogAttributes } from 'svelte/elements';
  import { createIds, createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.js';
  import { X } from '@lucide/svelte';
  import '../Dialog/dialog.css';
  const t = useMessages(drawer);

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
   *
   * Name: `title` (visible, or `hideTitle` for screen readers only), or `aria-label`, or
   * `aria-labelledby` pointing at your own heading. Other attributes (`id`, `data-*`) reach the
   * `<dialog>`.
   */

  interface Props extends Omit<HTMLDialogAttributes, 'children' | 'open' | 'title' | 'class' | 'role' | 'onclose' | 'oncancel'> {
    open?:         boolean;
    side?:         'left' | 'right' | 'bottom';
    /** Heading of the default header, and the accessible name of the panel. */
    title?:        string;
    /** Keeps `title` as the accessible name but hides the heading visually; the header shrinks to the close button. */
    hideTitle?:    boolean;
    /** Width (left/right). Default: 360px */
    width?:        string;
    class?:        string;
    children?:     Snippet;
    actions?:      Snippet;
    onOpenChange?: (open: boolean) => void;
  }

  const uid = $props.id();
  const ids = createIds(uid);

  let {
    open      = $bindable(false),
    side      = 'right',
    title,
    hideTitle = false,
    width     = '360px',
    class: className = '',
    children,
    actions,
    onOpenChange,
    style,
    'aria-labelledby': ariaLabelledby,
    ...rest
  }: Props = $props();

  // An explicit aria-labelledby/aria-label (own header, hidden title) replaces the title reference.
  const labelledby = $derived(
    ariaLabelledby ?? (rest['aria-label'] || !title ? undefined : ids.part('title'))
  );

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
    {...rest}
    class="ca-overlay ca-overlay--drawer ca-drawer ca-drawer--{side} {className}"
    role="dialog"
    aria-labelledby={labelledby}
    data-state={open ? 'open' : 'closed'}
    style="--drawer-w:{width};{style ?? ''}"
    {@attach presence.ref}
    {@attach modalLayer(() => ({ onDismiss: () => change(false), closing: !open }))}
  >
    <div class="ca-drawer__header" class:ca-drawer__header--bare={hideTitle}>
      {#if title}
        <h2 id={ids.part('title')} class="ca-drawer__title" class:ca-sr-only={hideTitle}>{title}</h2>
      {/if}
      <button type="button" class="ca-layer-close" aria-label={t().drawer.close} onclick={() => change(false)}>
        <X size={16} stroke-width={2} />
      </button>
    </div>

    <div class="ca-drawer__body">
      {@render children?.()}
    </div>

    {#if actions}
      <div class="ca-drawer__actions">
        {@render actions()}
      </div>
    {/if}
  </dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* The panel is a native <dialog> in the top layer: no z-index needed. */

    /* ── Drawer panel ───────────────────────────────────────────── */
    :global(dialog.ca-drawer) {
      position: fixed;
      inset: auto;
      margin: 0;
      background: var(--ca-surface-overlay);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--ca-shadow-xl);
      outline: none;
    }
    :global(dialog.ca-drawer:not([open])) {
      display: none;
    }

    /* ── Side variants ──────────────────────────────────────────── */
    :global(dialog.ca-drawer--right) {
      top: 0; bottom: 0; right: 0;
      height: auto;
      width: var(--drawer-w, 360px);
      max-width: calc(100vw - var(--ca-space-12));
      border-radius: var(--ca-radius-xl) 0 0 var(--ca-radius-xl);
      border-right: none;
    }
    :global(dialog.ca-drawer--left) {
      top: 0; bottom: 0; left: 0;
      height: auto;
      width: var(--drawer-w, 360px);
      max-width: calc(100vw - var(--ca-space-12));
      border-radius: 0 var(--ca-radius-xl) var(--ca-radius-xl) 0;
      border-left: none;
    }
    :global(dialog.ca-drawer--bottom) {
      bottom: 0; left: 0; right: 0;
      width: 100%;
      height: auto;
      max-height: calc(var(--ca-vh) * 0.85);
      border-radius: var(--ca-radius-xl) var(--ca-radius-xl) 0 0;
      border-bottom: none;
    }

    /* ── Animations: right ─────────────────────────────────────── */
    :global(dialog.ca-drawer--right[data-state='open']) {
      animation: ca-drawer-right-in var(--ca-enter-base) var(--ca-ease-decelerate) both;
    }
    :global(dialog.ca-drawer--right[data-state='closed']) {
      animation: ca-drawer-right-out var(--ca-enter-fast) var(--ca-ease-standard) both;
    }

    /* ── Animations: left ──────────────────────────────────────── */
    :global(dialog.ca-drawer--left[data-state='open']) {
      animation: ca-drawer-left-in var(--ca-enter-base) var(--ca-ease-decelerate) both;
    }
    :global(dialog.ca-drawer--left[data-state='closed']) {
      animation: ca-drawer-left-out var(--ca-enter-fast) var(--ca-ease-standard) both;
    }

    /* ── Animations: bottom ────────────────────────────────────── */
    :global(dialog.ca-drawer--bottom[data-state='open']) {
      animation: ca-drawer-bottom-in var(--ca-enter-base) var(--ca-ease-decelerate) both;
    }
    :global(dialog.ca-drawer--bottom[data-state='closed']) {
      animation: ca-drawer-bottom-out var(--ca-enter-fast) var(--ca-ease-standard) both;
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

    /* hideTitle: the heading is screen-reader-only, so the close button alone sits at the end. */
    :global(.ca-drawer__header--bare) {
      justify-content: flex-end;
      border-bottom: none;
      padding-bottom: 0;
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
}
</style>

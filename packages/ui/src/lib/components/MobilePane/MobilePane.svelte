<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { mobilePane } from '../../i18n/groups/mobilePane.js';
  import type { Snippet } from 'svelte';
  import { ArrowLeft } from '@lucide/svelte';
    import { keyboardAware } from '../../actions/keyboard-aware.js';
  import { createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.svelte.js';
  import IconButton from '../Button/IconButton.svelte';
  import MobileHeader from '../AppShell/MobileHeader.svelte';
  const t = useMessages(mobilePane);

  /**
   * MobilePane: a full-screen layer above the shell for mobile drill-down
   * (chat thread, history, detail). Replaces a hand-rolled `position: fixed`.
   *
   * Header with a back button, a body with its own scroll (`overscroll-behavior: contain`),
   * safe-area insets on every side and virtual keyboard awareness. The pane is a modal layer
   * (a native `<dialog>` in the top layer, on the shared layer stack): Escape closes, focus
   * moves into it on open and returns to the opener on close, and with the overlay-history
   * bridge (`bridgeOverlaysToHistory`, `<OverlayHistory />`) the browser's Back closes it.
   *
   * Usage:
   *   <MobilePane bind:open title="Maria" onback={() => (chatId = null)}>
   *     <Messages />
   *   </MobilePane>
   */
  interface Props {
    /** Visibility (bindable). The back button and Escape set it to `false`. */
    open?: boolean;
    /** Header title and accessible name of the pane. */
    title: string;
    /** Called after the back button or Escape closes the pane. */
    onback?: () => void;
    /** Scrollable body. */
    children: Snippet;
    /** Right side of the header. */
    actions?: Snippet;
    /** Replaces the title text in the header (e.g. avatar + name); `title` remains the accessible name. */
    headerTitle?: Snippet;
    /**
     * `true` (default): the body scrolls. `false`: the body is a non-scrolling flex column,
     * for layouts with their own scrollable area and a fixed composer (chat).
     */
    scroll?: boolean;
    /** Give the pane a browser-history entry under the overlay-history bridge (Back closes it). Default `true`. */
    history?: boolean;
    class?: string;
  }

  let {
    open = $bindable(false),
    title,
    onback,
    children,
    actions,
    headerTitle,
    scroll = true,
    history = true,
    class: className = '',
  }: Props = $props();

  const presence = createPresence(() => open);

  function close() {
    open = false;
    onback?.();
  }
</script>

{#if presence.present}
  <!-- An explicit role keeps `[role="dialog"]` selectors (and every engine) seeing the dialog. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <dialog
    class="ca-mobile-pane {className}"
    role="dialog"
    aria-label={title}
    data-state={open ? 'open' : 'closed'}
    {@attach presence.ref}
    {@attach modalLayer(() => ({ onDismiss: close, outside: false, initial: 'container', closing: !open, history }))}
    use:keyboardAware
  >
    <MobileHeader class="ca-mobile-pane__header" title={title} titleSlot={headerTitle}>
      {#snippet leading()}
        <IconButton variant="text" aria-label={t().mobilePane.back} onclick={close}>
          <ArrowLeft size={22} aria-hidden="true" />
        </IconButton>
      {/snippet}
      {#snippet trailing()}
        {#if actions}{@render actions()}{/if}
      {/snippet}
    </MobileHeader>

    <div class="ca-mobile-pane__body" class:ca-mobile-pane__body--fixed={!scroll}>
      {@render children()}
    </div>
  </dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* A modal <dialog> in the top layer: reset the UA box (margin, border, max size, padding). */
    .ca-mobile-pane {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
      border: 0;
      width: 100%;
      max-width: none;
      max-height: none;
      height: var(--ca-vh);
      color: inherit;
      background: var(--ca-surface-base);
      outline: none;
    }

    .ca-mobile-pane[open] {
      display: flex;
      flex-direction: column;
    }

    /* The header already adds --ca-safe-top/left/right. Inside a flex column it must not grow. */
    .ca-mobile-pane :global(.ca-mobile-pane__header) {
      flex: 0 0 auto;
    }

    .ca-mobile-pane__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: var(--ca-safe-bottom);
      padding-left: var(--ca-safe-left);
      padding-right: var(--ca-safe-right);
    }

    .ca-mobile-pane__body--fixed {
      overflow: hidden;
    }
}
</style>

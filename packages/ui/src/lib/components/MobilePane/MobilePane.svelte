<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { ArrowLeft } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { keyboardAware } from '../../actions/keyboard-aware.js';
  import IconButton from '../Button/IconButton.svelte';
  import MobileHeader from '../AppShell/MobileHeader.svelte';
  const t = useT();

  /**
   * MobilePane: a full-screen layer above the shell for mobile drill-down
   * (chat thread, history, detail). Replaces a hand-rolled `position: fixed`.
   *
   * Header with a back button, a body with its own scroll (`overscroll-behavior: contain`),
   * safe-area insets on every side and virtual keyboard awareness. Escape closes; focus
   * moves into the pane on open and returns to the previous element on close.
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
    class: className = '',
  }: Props = $props();

  let pane = $state<HTMLElement>();
  let previous: HTMLElement | null = null;

  function close() {
    open = false;
    onback?.();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    close();
  }

  // Focus moves in on open and returns to the previous element on close/unmount.
  $effect(() => {
    if (!open) return;
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    tick().then(() => pane?.focus({ preventScroll: true }));
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      previous = null;
    };
  });
</script>

{#if open}
  <div
    bind:this={pane}
    class="ca-mobile-pane {className}"
    role="dialog"
    aria-label={title}
    tabindex="-1"
    {onkeydown}
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
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-mobile-pane {
      position: fixed;
      inset: 0;
      z-index: var(--ca-z-fixed);
      height: var(--ca-vh);
      display: flex;
      flex-direction: column;
      background: var(--ca-surface-base);
      outline: none;
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

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Brand mark before the title. */
    leading?:  Snippet;
    title?:    string;
    /** Replaces the plain title text (e.g. a tappable session title). */
    titleSlot?: Snippet;
    trailing?: Snippet;
    class?:    string;
  }

  let { leading, title, titleSlot, trailing, class: className = '' }: Props = $props();
</script>

<header class="ca-mobile-header {className}">
  <div class="ca-mobile-header__inner">
    {#if leading}
      <div class="ca-mobile-header__leading">{@render leading()}</div>
    {/if}
    {#if titleSlot}
      <div class="ca-mobile-header__title ca-mobile-header__title--custom">{@render titleSlot()}</div>
    {:else}
      <span class="ca-mobile-header__title">{title ?? ''}</span>
    {/if}
    {#if trailing}
      <div class="ca-mobile-header__trailing">{@render trailing()}</div>
    {/if}
  </div>
</header>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-mobile-header {
      /* The shell wraps this in a flex row on mobile: fill it instead of shrinking to the title. */
      flex: 1;
      min-width: 0;
      position: sticky;
      top: 0;
      z-index: var(--ca-z-sticky);
      /* Notch / dynamic island: the header background extends under the status bar.
         Opaque on purpose: browsers tint the status bar from this element (Safari 26
         samples sticky/fixed edge elements; a translucent color there never matches). */
      padding-top: var(--ca-safe-top);
      background-color: var(--ca-chrome-surface);
      box-shadow: inset 0 calc(var(--ca-border-width) * -1) 0 var(--ca-outline-subtle);
    }

    .ca-mobile-header__inner {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      height: var(--ca-space-12);
      padding: 0 max(var(--ca-space-4), var(--ca-safe-left)) 0 max(var(--ca-space-4), var(--ca-safe-right));
    }

    .ca-mobile-header__leading {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .ca-mobile-header__title {
      font-size: var(--ca-font-size-h6);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-semibold);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1 1 auto;
      min-width: 0;
    }

    .ca-mobile-header__title--custom {
      display: flex;
      align-items: center;
    }

    .ca-mobile-header__trailing {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ca-space-2);
      flex: 0 1 auto;
      min-width: 0;
      /* Keep the title readable: actions may shrink to at most ~60% of the row. */
      max-width: 60%;
      margin-left: auto;
    }
}
</style>

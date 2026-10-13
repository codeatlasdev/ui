<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '../../i18n/state.svelte.js';

  interface Props {
    /** Fragment id of the main landmark to jump to. Must match the `id` of the `<main>`. */
    href?: string;
    class?: string;
    /** Replaces the localized "Skip to content" label. */
    children?: Snippet;
  }

  let { href = '#main', class: className = '', children }: Props = $props();

  // Same-page fragment links do not move focus in every browser (and SvelteKit's router
  // intercepts them), so focus the target explicitly. `tabindex="-1"` on it makes that work.
  function jump(e: MouseEvent) {
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.focus({ preventScroll: false });
  }
</script>

<a class="ca-skip-link {className}" {href} onclick={jump}>
  {#if children}{@render children()}{:else}{t().skipLink.label}{/if}
</a>

<style>
  .ca-skip-link {
    position: fixed;
    top: calc(0.5rem + var(--ca-safe-top));
    left: calc(0.5rem + var(--ca-safe-left));
    z-index: calc(var(--ca-z-modal, 1300) + 10);
    padding: 0.625rem 1rem;
    border-radius: var(--ca-radius-md);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-body2);
    font-weight: 600;
    text-decoration: none;
    /* Off-screen until focused; stays in the tab order and the accessibility tree. */
    transform: translateY(calc(-100% - 2rem));
  }

  .ca-skip-link:focus-visible {
    transform: none;
  }

  @media (forced-colors: active) {
    .ca-skip-link {
      border: 1px solid CanvasText;
    }
  }
</style>

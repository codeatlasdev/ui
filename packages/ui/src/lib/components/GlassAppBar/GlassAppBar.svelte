<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
    leading?: Snippet;
    trailing?: Snippet;
  }

  let { class: className = '', children, leading, trailing }: Props = $props();
</script>

<header class="ca-app-bar {className}" data-ca-blur-layer="chrome">
  <div class="ca-app-bar__leading">
    {@render leading?.()}
  </div>
  <div class="ca-app-bar__content">
    {@render children?.()}
  </div>
  <div class="ca-app-bar__trailing">
    {@render trailing?.()}
  </div>
</header>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-app-bar {
      position: sticky;
      top: 0;
      height: var(--ca-bottom-nav-h);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-2);
      padding: 0 var(--ca-space-4);
      z-index: var(--ca-z-nav);
      width: 100%;
      background-color: var(--ca-glass-tint-chrome);
      box-shadow:
        inset 0 0.5px 0 var(--ca-glass-rim),
        inset 0 -0.5px 0 var(--ca-glass-border);
    }

    /* No transparency asked: an opaque fill (the blur layer is already off); forced colours: the system canvas. */
    @media (prefers-reduced-transparency: reduce) {
      .ca-app-bar { background-color: var(--ca-glass-tint-solid); }
    }
    @media (forced-colors: active) {
      .ca-app-bar { background-color: Canvas; box-shadow: none; }
    }

    .ca-app-bar__leading,
    .ca-app-bar__trailing {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    .ca-app-bar__content {
      flex: 1;
      display: flex;
      align-items: center;
      min-width: 0;
    }
}
</style>

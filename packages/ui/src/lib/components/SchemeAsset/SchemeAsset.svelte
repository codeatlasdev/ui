<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Rendered while the light scheme is active. */
    light: Snippet;
    /** Rendered while the dark scheme is active. */
    dark: Snippet;
    class?: string;
  }

  let { light, dark, class: className = '' }: Props = $props();
</script>

<!-- Both variants are in the markup and CSS picks one from the kit's scheme (`.dark` on <html>, or a
     `data-theme-scope` island): correct in SSR and on first paint, no store read, no flash. -->
<span class="ca-scheme-asset {className}">
  <span class="ca-scheme-asset__light">{@render light()}</span>
  <span class="ca-scheme-asset__dark">{@render dark()}</span>
</span>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-scheme-asset) {
      display: contents;
    }
    :global(.ca-scheme-asset__light),
    :global(.ca-scheme-asset__dark) {
      display: contents;
    }
    :global(.ca-scheme-asset__dark) {
      display: none;
    }

    :global(.dark .ca-scheme-asset__light),
    :global([data-theme-scope='dark'] .ca-scheme-asset__light) {
      display: none;
    }
    :global(.dark .ca-scheme-asset__dark),
    :global([data-theme-scope='dark'] .ca-scheme-asset__dark) {
      display: contents;
    }

    /* A light island inside a dark page. */
    :global([data-theme-scope='light'] .ca-scheme-asset__light) {
      display: contents;
    }
    :global([data-theme-scope='light'] .ca-scheme-asset__dark) {
      display: none;
    }
}
</style>

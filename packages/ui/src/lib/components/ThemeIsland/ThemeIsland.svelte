<script lang="ts">
  import type { Snippet } from 'svelte';
  import { mirrorIsland } from '../../theme/island.js';

  interface Props {
    /** `data-preset` of the island: a built-in or a brand preset of your theme. Omit to keep the page's preset and change only the scheme. */
    preset?: string;
    /** Scheme of the island, whatever the rest of the app uses. */
    scheme: 'light' | 'dark';
    /**
     * Full-page island: also apply preset, scheme and `color-scheme` to `<html>` while mounted, and
     * put the app's values back on unmount. Without it `html` and `body` keep painting the app
     * preset (overscroll, behind the iOS toolbar, pages that do not scroll).
     * @default false
     */
    document?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { preset, scheme, document: mirror = false, class: className = '', children }: Props = $props();

  // `document` is a mount-time decision per island; preset/scheme changes re-mirror.
  $effect(() => {
    if (!mirror) return;
    return mirrorIsland(window.document.documentElement, { preset, scheme });
  });
</script>

<!-- The attributes are on the element itself: SSR already carries them, so the island paints right
     on the first frame. The theme tokens (`[data-theme-scope]`, `[data-preset]`) re-resolve inside. -->
<div
  class="ca-theme-island {className}"
  data-preset={preset}
  data-theme-scope={scheme}
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-theme-island) {
      /* The island owns its canvas: it must not show the app preset through it. */
      background-color: var(--ca-surface-base);
      color: var(--ca-text-primary);
      min-height: var(--ca-vh);
    }
}
</style>

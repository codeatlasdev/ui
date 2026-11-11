<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * CardGrid: responsive auto-fill grid for LinkCard or any cards. `minItemWidth` (any CSS length,
   * default `16rem`) is the narrowest a column gets: a wide area holds more columns, a phone one.
   */
  let { minItemWidth, children }: { minItemWidth?: string; children?: Snippet } = $props();
</script>

<div class="ca-card-grid" style:--ca-card-grid-min={minItemWidth}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ca-card-grid-min, 16rem)), 1fr));
      gap: var(--ca-space-3);
      margin: var(--ca-space-5) 0;
    }
}
</style>

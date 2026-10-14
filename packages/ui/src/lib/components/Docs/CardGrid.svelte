<script lang="ts">
  import type { Snippet } from 'svelte';

  /** CardGrid: responsive auto-fill grid for LinkCard (min 16rem, 1 column on phones). */
  let { children }: { children?: Snippet } = $props();
</script>

<div class="ca-card-grid">
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
      gap: var(--ca-space-3);
      margin: var(--ca-space-5) 0;
    }
}
</style>

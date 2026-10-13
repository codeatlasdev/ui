<script lang="ts">
  import type { Snippet } from 'svelte';

  /** CardGrid: responsive auto-fill grid for LinkCard (min 16rem, 1 column on phones). */
  let { children }: { children?: Snippet } = $props();
</script>

<div class="ca-card-grid">
  {@render children?.()}
</div>

<style>
  .ca-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
    gap: 0.75rem;
    margin: 1.25rem 0;
  }
</style>

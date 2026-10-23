<script lang="ts">
  import { Button, ThemeIsland } from '@codeatlasdev/ui';

  let open = $state(false);
</script>

<Button variant="outlined" size="sm" onclick={() => (open = true)}>Open full-page island</Button>

{#if open}
  <!-- `document` also paints <html> and <body> like the island and puts the app back on unmount. -->
  <div class="overlay">
    <ThemeIsland preset="rose" scheme="light" document>
      <div class="page">
        <h3>Full-page island</h3>
        <p>The overscroll area and the browser chrome match this page. Close it to restore the app theme.</p>
        <Button variant="filled" onclick={() => (open = false)}>Back to the app</Button>
      </div>
    </ThemeIsland>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--ca-z-modal);
    overflow: auto;
  }
  .page {
    display: grid;
    gap: var(--ca-space-4);
    justify-items: start;
    padding: var(--ca-space-10) var(--ca-page-px);
    max-width: 40rem;
  }
</style>

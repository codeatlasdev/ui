<script lang="ts">
  import { Button, ThemeIsland } from '@codeatlasdev/ui';
</script>

<!-- A light island inside whatever scheme the page uses. -->
<ThemeIsland preset="ocean" scheme="light" class="island">
  <div class="island-body">
    <h3>Ink on cream</h3>
    <p>This block is light even when the app is dark.</p>
    <Button variant="filled" size="sm">Get started</Button>
  </div>
</ThemeIsland>

<style>
  :global(.island) {
    min-height: 0;
    border-radius: var(--ca-radius-lg);
    overflow: hidden;
  }
  .island-body {
    display: grid;
    gap: var(--ca-space-3);
    padding: var(--ca-space-6);
    justify-items: start;
  }
</style>

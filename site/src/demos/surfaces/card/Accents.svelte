<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
</script>

<div class="row">
  <Card material="glass" tone="brand" class="accent">
    <p class="title">Tinted</p>
    <p class="text">Brand gradient overlay on the surface.</p>
  </Card>
  <Card material="glass" glow class="accent">
    <p class="title">Glowing</p>
    <p class="text">Backlit halo behind the surface.</p>
  </Card>
</div>

<style>
  .row { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); width: 100%; }
  :global(.accent) { flex: 1; min-width: 200px; }
  .title { margin: 0 0 4px; font-size: var(--ca-font-size-h5); font-weight: 600; color: var(--ca-text-primary); }
  .text { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

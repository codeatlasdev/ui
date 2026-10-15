<script lang="ts">
  import { Card } from '@codeatlasdev/ui';
</script>

<Card material="glass" class="content-card">
  <div class="body">
    <p class="eyebrow">Featured</p>
    <h3>Liquid Glass materials</h3>
    <p class="text">
      Depth and clarity for UI surfaces through real-time backdrop blur and optical refraction.
    </p>
    <a href="/docs/foundation/materials/">Explore materials →</a>
  </div>
</Card>

<style>
  :global(.content-card) { max-width: 360px; width: 100%; }
  .body { display: flex; flex-direction: column; gap: var(--ca-space-2); }
  .eyebrow {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ca-brand-text);
  }
  h3 { margin: 0; font-size: var(--ca-font-size-h5); font-weight: 600; color: var(--ca-text-primary); }
  .text { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); line-height: 1.5; }
  a { font-size: var(--ca-font-size-body2); font-weight: 500; color: var(--ca-brand-text); text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>

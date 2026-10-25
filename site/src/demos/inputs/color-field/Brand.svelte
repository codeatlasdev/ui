<script lang="ts">
  import { ColorField } from '@codeatlasdev/ui';

  let brand = $state('#2b5fd9');
</script>

<div class="col">
  <ColorField label="Brand color" bind:value={brand} against="#ffffff" role="fill" minRatio={3} description="Type #hex, rgb() or oklch(), or pick." />
  <p class="out">value: {brand}</p>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    max-inline-size: 22rem;
  }

  .out {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>

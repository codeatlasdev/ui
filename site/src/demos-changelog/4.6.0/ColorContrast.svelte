<script lang="ts">
  import { Button, ColorField, SliderField } from '@codeatlasdev/ui';

  let brand = $state('#1d4ed8');
  let radius = $state(10);
  // Buttons use --ca-radius-md, which is 10px times --ca-radius-scale: 10px of "Radius" is a scale of 1.
  const scale = $derived(radius / 10);
</script>

<div class="col">
  <ColorField label="Brand colour" bind:value={brand} against="#ffffff" role="fill" minRatio={3} />
  <SliderField label="Radius" unit="px" min={0} max={20} bind:value={radius} />
  <div class="preview" style="--ca-radius-scale:{scale}">
    <Button>Start free trial</Button>
    <Button variant="outlined">Learn more</Button>
    <span class="swatch" style="background:{brand}" role="img" aria-label="Brand colour {brand}"></span>
  </div>
  <p class="hint">Brand {brand}, radius {radius}px.</p>
</div>

<style>
  .col { display: grid; gap: var(--ca-space-4); max-inline-size: 24rem; }
  .preview { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
  .swatch { inline-size: var(--ca-space-8); block-size: var(--ca-space-8); border-radius: var(--ca-radius-md); }
  .hint { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); font-family: var(--ca-font-mono); }
</style>

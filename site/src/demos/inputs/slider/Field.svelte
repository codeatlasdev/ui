<script lang="ts">
  import { SliderField } from '@codeatlasdev/ui';

  let radius = $state(0.8);
  let scale = $state(1);
</script>

<div class="col">
  <SliderField label="Radius" bind:value={radius} min={0} max={2} step={0.05} unit="x" />
  <SliderField label="Type scale" bind:value={scale} min={0.8} max={1.3} step={0.01} unit="x" description="Multiplies every font size." />
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    max-inline-size: 22rem;
  }
</style>

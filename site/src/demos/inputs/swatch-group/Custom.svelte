<script lang="ts">
  import { SwatchGroup } from '@codeatlasdev/ui';

  let color = $state('#2563eb');
</script>

<div class="col">
  <SwatchGroup
    size="sm"
    aria-label="Label color"
    bind:value={color}
    items={[
      { value: '#2563eb', label: 'Blue', color: '#2563eb' },
      { value: '#16a34a', label: 'Green', color: '#16a34a' },
      { value: '#dc2626', label: 'Red', color: '#dc2626' },
      { value: '#9333ea', label: 'Purple', color: '#9333ea', disabled: true },
    ]}
  />
  <p class="out">value: {color}</p>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
  }

  .out {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }
</style>

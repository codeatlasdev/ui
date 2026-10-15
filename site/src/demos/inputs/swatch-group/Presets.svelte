<script lang="ts">
  import { SwatchGroup } from '@codeatlasdev/ui';

  let preset = $state('ocean');
</script>

<div class="col">
  <SwatchGroup
    aria-label="Accent"
    bind:value={preset}
    items={[
      { value: 'ocean' },
      { value: 'violet' },
      { value: 'emerald' },
      { value: 'rose' },
      { value: 'amber' },
    ]}
  />
  <p class="out">value: {preset}</p>
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

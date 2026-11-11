<script lang="ts">
  import { Rating } from '@codeatlasdev/ui';

  let service = $state(4);
  let food = $state(3.5);
</script>

<div class="ratings">
  <Rating label="Service" bind:value={service} />
  <Rating label="Food" step={0.5} bind:value={food} />
  <Rating label="Average" readonly step={0.5} value={4.5} size="sm" />
</div>

<style>
  .ratings { display: grid; gap: var(--ca-space-4); }
</style>

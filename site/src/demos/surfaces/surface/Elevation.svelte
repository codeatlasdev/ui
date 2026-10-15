<script lang="ts">
  import { Surface } from '@codeatlasdev/ui';

  const levels = [0, 1, 2, 3, 4, 5] as const;
</script>

<div class="row">
  {#each levels as elevation (elevation)}
    <Surface material="solid" {elevation} p="4" class="tile">
      <p class="name">Elevation {elevation}</p>
    </Surface>
  {/each}
</div>

<style>
  .row { display: flex; flex-wrap: wrap; gap: var(--ca-space-4); width: 100%; padding: var(--ca-space-4); }
  .row :global(.tile) { flex: 1; min-width: 7rem; text-align: center; }
  .name { margin: 0; font-size: var(--ca-font-size-caption); font-weight: 600; }
</style>

<script lang="ts">
  import { Surface } from '@codeatlasdev/ui';

  const materials = ['auto', 'solid', 'frosted', 'glass', 'liquid'] as const;
</script>

<div class="backdrop">
  {#each materials as material (material)}
    <Surface {material} elevation={3} p="4" class="tile">
      <p class="name">{material}</p>
    </Surface>
  {/each}
</div>

<style>
  .backdrop {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-3);
    width: 100%;
    padding: var(--ca-space-6);
    border-radius: var(--ca-radius-lg);
    background: linear-gradient(135deg, var(--ca-brand-main) 0%, var(--ca-semantic-info) 50%, var(--ca-semantic-success) 100%);
  }
  .backdrop :global(.tile) { flex: 1; min-width: 7rem; text-align: center; }
  .name { margin: 0; font-family: var(--ca-font-mono); font-size: var(--ca-font-size-caption); font-weight: 600; }
</style>

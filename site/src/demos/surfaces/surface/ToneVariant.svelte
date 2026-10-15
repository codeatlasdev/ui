<script lang="ts">
  import { Surface } from '@codeatlasdev/ui';

  const tones = ['neutral', 'brand', 'success', 'warning', 'error', 'info'] as const;
  const variants = ['filled', 'outlined', 'ghost'] as const;
</script>

<div class="grid">
  {#each variants as variant (variant)}
    {#each tones as tone (tone)}
      <Surface material="solid" elevation={1} {tone} {variant} p="3" class="tile">
        <p class="name">{tone}<br />{variant}</p>
      </Surface>
    {/each}
  {/each}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr)); gap: var(--ca-space-3); width: 100%; padding: var(--ca-space-4); }
  .name { margin: 0; font-size: var(--ca-font-size-caption); text-align: center; }
</style>

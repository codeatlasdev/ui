<script lang="ts">
  import { GlassCard } from '@codeatlasdev/ui';

  const stats = [
    { label: 'Components', value: '70+', delta: 'Svelte 5' },
    { label: 'Presets', value: '8', delta: 'Amber, Ocean, Crimson and more' },
    { label: 'Tokens', value: '80+', delta: 'CSS custom properties' },
  ];
</script>

<div class="grid">
  {#each stats as s}
    <GlassCard class="stat">
      <p class="label">{s.label}</p>
      <p class="value">{s.value}</p>
      <p class="delta">{s.delta}</p>
    </GlassCard>
  {/each}
</div>

<style>
  .grid { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); width: 100%; }
  :global(.stat) { flex: 1; min-width: 140px; }
  .label {
    margin: 0 0 4px;
    font-size: var(--ca-font-size-caption);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ca-text-secondary);
  }
  .value { margin: 0 0 4px; font-size: var(--ca-font-size-h3); font-weight: 700; line-height: 1.1; color: var(--ca-text-primary); }
  .delta { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-brand-text); }
</style>

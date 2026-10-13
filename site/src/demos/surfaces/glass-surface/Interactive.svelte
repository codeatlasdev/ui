<script lang="ts">
  import { Checkbox, GlassSurface, SegmentedControl } from '@codeatlasdev/ui';
  import type { Thickness } from '@codeatlasdev/ui';

  const tiers: Thickness[] = ['ultra-thin', 'thin', 'regular', 'thick', 'chrome'];
  let thickness = $state<Thickness>('regular');
  let tinted = $state(false);
  let glowing = $state(false);
</script>

<div class="controls">
  <SegmentedControl
    aria-label="Thickness"
    items={tiers.map((t) => ({ value: t, label: t }))}
    bind:value={thickness}
  />
  <div class="group">
    <Checkbox label="Tinted" bind:checked={tinted} />
    <Checkbox label="Glowing" bind:checked={glowing} />
  </div>

  <div class="backdrop">
    <GlassSurface {thickness} {tinted} {glowing} refraction={false} class="preview">
      <p class="name">{thickness}{tinted ? ' · tinted' : ''}{glowing ? ' · glowing' : ''}</p>
      <p class="sub">GlassSurface</p>
    </GlassSurface>
  </div>
</div>

<style>
  .controls { display: flex; flex-direction: column; gap: var(--ca-space-3); width: 100%; }
  .group { display: flex; align-items: center; gap: var(--ca-space-2); flex-wrap: wrap; }
  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ca-font-size-caption);
    font-weight: 500;
    color: var(--ca-text-secondary);
    cursor: pointer;
  }
  :global(.preview) { padding: 32px 48px; border-radius: var(--ca-radius-lg); text-align: center; min-width: 200px; }
  .name { margin: 0 0 4px; font-family: var(--ca-font-mono); font-size: var(--ca-font-size-body1); font-weight: 600; color: var(--ca-text-primary); }
  .sub { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
</style>

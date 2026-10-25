<script lang="ts">
  import { SegmentedControl, Select, SliderField } from '@codeatlasdev/ui';
  import { DESIGN_STYLES, type DesignStyleId, type SurfaceStyle } from '../engine';
  import type { StudioState } from '../studio-state';
  import { ELEVATIONS, opts, PAPERS, SURFACE_STYLES } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  const baseOptions = Object.values(DESIGN_STYLES).map((d) => ({ value: d.id, label: d.label }));

  // Roving tabindex radiogroup: one tab stop, arrows move and select.
  let group = $state<HTMLElement>();
  function onkeydown(e: KeyboardEvent) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const i = SURFACE_STYLES.findIndex((s) => s.id === theme.surface);
    let next = i;
    if (e.key in keys) next = (i + keys[e.key] + SURFACE_STYLES.length) % SURFACE_STYLES.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = SURFACE_STYLES.length - 1;
    else return;
    e.preventDefault();
    patch({ surface: SURFACE_STYLES[next].id as SurfaceStyle });
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }
</script>

<div class="ts-stack">
  <div class="ts-field">
    <span class="ts-label" id="ts-material-label">Surface material</span>
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      bind:this={group}
      class="ts-tiles"
      role="radiogroup"
      aria-labelledby="ts-material-label"
      tabindex="-1"
      {onkeydown}
    >
      {#each SURFACE_STYLES as s (s.id)}
        {@const on = theme.surface === s.id}
        <button
          type="button"
          role="radio"
          aria-checked={on}
          tabindex={on ? 0 : -1}
          class="ts-tile"
          onclick={() => patch({ surface: s.id as SurfaceStyle })}
        >
          <span class="ts-thumb" data-style={s.id} data-preset={theme.preset} aria-hidden="true">
            <span class="ts-thumb__card" data-ca-blur="regular"></span>
          </span>
          <span class="ts-tile__name">{s.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <Select
    label="Design style"
    description="The recipe your edits sit on."
    options={baseOptions}
    value={theme.base}
    onchange={(v) => patch({ base: v as DesignStyleId })}
  />

  <div class="ts-field">
    <span class="ts-label">Elevation</span>
    <SegmentedControl
      aria-label="Elevation"
      fullWidth
      size="sm"
      items={ELEVATIONS.map((value) => ({ value, label: value }))}
      value={theme.elevation}
      onchange={(v) => patch({ elevation: v as StudioState['elevation'] })}
    />
  </div>

  <Select
    label="Paper"
    options={opts(PAPERS)}
    value={theme.paper}
    onchange={(v) => patch({ paper: v as StudioState['paper'] })}
  />

  <SliderField
    label="Noise"
    min={0}
    max={0.12}
    step={0.01}
    value={theme.noise}
    onchange={(v) => patch({ noise: v }, 'noise')}
  />
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    min-width: 0;
  }
  .ts-field {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
    min-width: 0;
  }
  .ts-label {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
  }
  .ts-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
    gap: var(--ca-space-2);
  }
  .ts-tile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--ca-space-1);
    min-width: 0;
    min-height: 44px;
    padding: var(--ca-space-1);
    background: transparent;
    border: 0;
    border-radius: var(--ca-radius-md);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
    color: var(--ca-text-secondary);
    font: inherit;
    font-size: var(--ca-font-size-caption);
    cursor: pointer;
  }
  .ts-tile[aria-checked='true'] {
    box-shadow: inset 0 0 0 2px var(--ca-brand-main);
    color: var(--ca-text-primary);
  }
  .ts-tile:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: 2px;
  }
  .ts-tile__name {
    text-align: center;
  }
  /* The thumbnail is its own scope: [data-style] there redefines the --ca-mat-* tokens, so the
     mini card is painted by the library's material CSS, not by this file. */
  .ts-thumb {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    border-radius: var(--ca-radius-sm);
    background: linear-gradient(135deg, var(--ca-brand-main), var(--ca-surface-sunken));
    overflow: hidden;
  }
  .ts-thumb__card {
    inline-size: 60%;
    block-size: 55%;
    border-radius: var(--ca-radius-sm);
    background: var(--ca-mat-regular-fill, var(--ca-surface-raised));
    box-shadow: var(--ca-mat-edge, none), var(--ca-mat-regular-shadow, none);
  }
</style>

<script lang="ts">
  import { SegmentedControl, Select, SliderField } from '@codeatlasdev/ui';
  import type { StudioState } from '../studio-state';
  import { DENSITIES, opts, RADII } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();
</script>

<div class="ts-stack">
  <SliderField
    label="Corner radius"
    unit="x"
    min={0}
    max={2}
    step={0.05}
    value={theme.radius}
    onchange={(v) => patch({ radius: v }, 'radius')}
  />

  <Select
    label="Control radius"
    description="Buttons, fields and chips."
    options={opts(RADII)}
    value={theme.controlRadius}
    onchange={(v) => patch({ controlRadius: v as StudioState['controlRadius'] })}
  />

  <div class="ts-field">
    <span class="ts-label">Density</span>
    <SegmentedControl
      aria-label="Density"
      fullWidth
      size="sm"
      items={DENSITIES.map((value) => ({ value, label: value }))}
      value={theme.density}
      onchange={(v) => patch({ density: v as StudioState['density'] })}
    />
  </div>

  <SliderField
    label="Border width"
    unit="px"
    min={0}
    max={4}
    step={0.5}
    value={theme.borderWidth}
    onchange={(v) => patch({ borderWidth: v }, 'borderWidth')}
  />
  <SliderField
    label="Strong border width"
    unit="px"
    min={0}
    max={6}
    step={0.5}
    value={theme.borderStrong}
    onchange={(v) => patch({ borderStrong: v }, 'borderStrong')}
  />
  <SliderField
    label="Icon stroke"
    min={0.75}
    max={2.5}
    step={0.25}
    value={theme.iconStroke}
    onchange={(v) => patch({ iconStroke: v }, 'iconStroke')}
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
</style>

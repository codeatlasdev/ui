<script lang="ts">
  import { Button, Select, SliderField, Switch, TextField } from '@codeatlasdev/ui';
  import type { StudioState } from '../studio-state';
  import {
    EASINGS,
    opts,
    SIZE_ERROR,
    TRACKING_ERROR,
    validGap,
    validTracking,
  } from './controls-model';

  interface Props {
    theme: StudioState;
    patch: (p: Partial<StudioState>, key?: string) => void;
  }
  let { theme, patch }: Props = $props();

  // Draft text per field: an invalid entry stays in the box with an error and never reaches state.
  let tracking = $state('');
  let gap = $state('');
  let trackingError = $state('');
  let gapError = $state('');
  $effect(() => {
    tracking = theme.buttonTracking ?? '';
    trackingError = '';
  });
  $effect(() => {
    gap = theme.buttonGap ?? '';
    gapError = '';
  });

  function commitTracking(v: string) {
    if (!validTracking(v)) return (trackingError = TRACKING_ERROR);
    trackingError = '';
    patch({ buttonTracking: v || undefined }, 'buttonTracking');
  }
  function commitGap(v: string) {
    if (!validGap(v)) return (gapError = SIZE_ERROR);
    gapError = '';
    patch({ buttonGap: v || undefined }, 'buttonGap');
  }
</script>

<div class="ts-stack">
  <SliderField
    label="Motion speed"
    unit="x"
    min={0}
    max={2}
    step={0.1}
    description="0 turns transitions off."
    value={theme.motionScale}
    onchange={(v) => patch({ motionScale: v }, 'motionScale')}
  />
  <Select
    label="Easing"
    options={opts(EASINGS)}
    value={theme.motionEasing}
    onchange={(v) => patch({ motionEasing: v as StudioState['motionEasing'] })}
  />
  <Switch
    label="No enter animation"
    checked={theme.motionEnter === 'none'}
    onchange={(on) => patch({ motionEnter: on ? 'none' : 'default' })}
  />

  <div class="ts-sub-row">
    <h4 class="ts-sub">Buttons</h4>
    <Button
      size="sm"
      variant="ghost"
      tone="neutral"
      disabled={theme.buttonWeight === undefined}
      onclick={() => patch({ buttonWeight: undefined })}
    >Default weight</Button>
  </div>
  <SliderField
    label="Button weight"
    min={400}
    max={700}
    step={100}
    value={theme.buttonWeight ?? 500}
    onchange={(v) => patch({ buttonWeight: v }, 'buttonWeight')}
  />
  <TextField
    label="Button tracking"
    size="sm"
    placeholder="0.01em"
    value={tracking}
    error={trackingError}
    spellcheck={false}
    oninput={(v) => (tracking = v)}
    onchange={commitTracking}
  />
  <TextField
    label="Button gap"
    size="sm"
    placeholder="0.5rem"
    value={gap}
    error={gapError}
    spellcheck={false}
    oninput={(v) => (gap = v)}
    onchange={commitGap}
  />
</div>

<style>
  .ts-stack {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    min-width: 0;
  }
  .ts-sub-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
  }
  .ts-sub {
    margin: 0;
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>

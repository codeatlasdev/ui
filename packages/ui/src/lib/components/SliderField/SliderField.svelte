<script lang="ts">
  import Slider from '../Slider/Slider.svelte';
  import TextField from '../TextField/TextField.svelte';
  import { uid } from '../../utils/index.js';

  /**
   * SliderField: a labelled slider with an editable value.
   *
   *   <SliderField label="Radius" bind:value={radius} min={0} max={2} step={0.05} />
   *
   * The slider is for scrubbing, the number field is for precise entry and for keyboard users who
   * want to type. Both write the same `value`; a typed value is clamped and snapped to `step` when
   * the field commits (Enter or blur). `onchange` fires per commit of either control.
   */
  interface Props {
    /** Visible label and the accessible name of both controls. */
    label: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    /** Unit shown after the number (`px`, `rem`, `deg`, `x`). */
    unit?: string;
    /** Content under the control. */
    description?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (value: number) => void;
  }

  let {
    label,
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    unit,
    description,
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  const id = uid('sf');
  const decimals = $derived((String(step).split('.')[1] ?? '').length);

  /** Clamp to the range and snap to `step` from `min`, without float drift. */
  function snap(v: number): number {
    const s = step > 0 ? step : 1;
    const snapped = min + Math.round((v - min) / s) * s;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))));
  }

  let text = $state('');
  let editing = $state(false);
  $effect(() => {
    if (!editing) text = value.toFixed(decimals);
  });

  function set(v: number) {
    if (v === value) return;
    value = v;
    onchange?.(v);
  }

  function commit() {
    editing = false;
    const n = Number.parseFloat(text.replace(',', '.'));
    if (Number.isFinite(n)) set(snap(n));
    text = value.toFixed(decimals);
  }
</script>

<div class="ca-slider-field {className}" data-disabled={disabled ? '' : undefined}>
  <div class="ca-slider-field__head">
    <span id="{id}-l" class="ca-slider-field__label">{label}</span>
    <span class="ca-slider-field__value">
      <TextField
        size="sm"
        hideLabel
        {label}
        {disabled}
        inputmode="decimal"
        suffix={unit}
        bind:value={text}
        oninput={() => (editing = true)}
        onblur={commit}
        onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && commit()}
      />
    </span>
  </div>
  <Slider {label} {min} {max} {step} {disabled} {value} onchange={(v) => set(v[0] ?? value)} />
  {#if description}<p class="ca-slider-field__hint">{description}</p>{/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-slider-field) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      min-width: 0;
    }

    :global(.ca-slider-field__head) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-3);
    }

    :global(.ca-slider-field__label) {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
    }

    :global(.ca-slider-field__value) {
      inline-size: 6.5rem;
      flex: none;
    }

    :global(.ca-slider-field__hint) {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }

    :global(.ca-slider-field[data-disabled] .ca-slider-field__label) {
      color: var(--ca-text-disabled);
    }
}
</style>

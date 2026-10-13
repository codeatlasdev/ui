<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { Slider } from 'bits-ui';

  /**
   * Slider — single or range value input.
   *
   * Single value (most common):
   *   <Slider bind:value={volume} min={0} max={100} />
   *
   * Range (two thumbs):
   *   <Slider bind:values={range} min={0} max={100} />
   *
   * `value` and `values` are independent — use one or the other.
   * `onchange` always receives the normalized array (length 1 or 2).
   */

  interface Props {
    /** Single-value mode — binds a plain number. */
    value?:    number;
    /** Range mode — binds a [min, max] tuple. */
    values?:   [number, number];
    min?:      number;
    max?:      number;
    step?:     number;
    disabled?: boolean;
    class?:    string;
    /** Called on change. Always receives array regardless of single/range mode. */
    onchange?: (value: number[]) => void;
  }

  let {
    value    = $bindable<number | undefined>(undefined),
    values   = $bindable<[number, number] | undefined>(undefined),
    min      = 0,
    max      = 100,
    step     = 1,
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  // Normalise to array for bits-ui (always multiple internally)
  let internal = $derived.by<number[]>(() => {
    if (values !== undefined) return values;
    if (value  !== undefined) return [value];
    return [Math.round((min + max) / 2)];
  });

  function handleChange(v: number[]) {
    if (values !== undefined) {
      values = [v[0], v[1] ?? values[1]];
    } else {
      value = v[0];
    }
    onchange?.(v);
  }
</script>

<Slider.Root
  type="multiple"
  value={internal}
  onValueChange={handleChange}
  {min}
  {max}
  {step}
  {disabled}
  class="ca-slider {className}"
>
  <div class="ca-slider__track">
    <Slider.Range class="ca-slider__range" />
  </div>
  {#each internal as _, i}
    <Slider.Thumb index={i} class="ca-slider__thumb" aria-label={t().slider.value(internal[i])} />
  {/each}
</Slider.Root>

<style>
  :global(.ca-slider) {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: var(--ca-space-5);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }

  :global(.ca-slider[disabled]) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .ca-slider__track {
    position: relative;
    flex: 1;
    height: var(--ca-space-1);
    background: var(--ca-outline-default);
    border-radius: var(--ca-radius-pill);
    overflow: visible;
  }

  :global(.ca-slider__range) {
    position: absolute;
    height: 100%;
    background: var(--ca-brand-main);
    border-radius: var(--ca-radius-pill);
  }

  :global(.ca-slider__thumb) {
    display: block;
    width: var(--ca-space-5);
    height: var(--ca-space-5);
    border-radius: 50%;
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width-strong) solid var(--ca-brand-main);
    box-shadow: var(--ca-shadow-sm);
    cursor: grab;
    transition:
      box-shadow var(--ca-duration-fast) var(--ca-ease-standard),
      transform  var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-slider__thumb:hover) {
    box-shadow: var(--ca-shadow-md), 0 0 0 var(--ca-space-1) color-mix(in oklab, var(--ca-brand-main) 16%, transparent);
    transform: scale(1.1);
  }

  :global(.ca-slider__thumb:active) {
    cursor: grabbing;
    transform: scale(1.15);
  }

  :global(.ca-slider__thumb:focus-visible) {
    outline: none;
    box-shadow:
      var(--ca-shadow-sm),
      0 0 0 var(--ca-space-0-5) var(--ca-surface-base),
      0 0 0 calc(var(--ca-space-0-5) + var(--ca-border-width-focus)) var(--ca-brand-main);
  }
</style>

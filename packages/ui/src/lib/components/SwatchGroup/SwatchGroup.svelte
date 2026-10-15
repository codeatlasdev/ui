<script lang="ts" module>
  export interface SwatchItem {
    /** Selected value. When `color` is omitted it is also the `data-preset` the swatch paints from. */
    value: string;
    /** Accessible name; falls back to `value`. */
    label?: string;
    /** Any CSS color. Omit to paint from the preset named by `value`. */
    color?: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { rovingFocus } from '../../primitives/index.js';

  interface Props {
    /** Selected `value`; leave unset or empty for "none" (for example while a custom color is active). */
    value?: string;
    items: SwatchItem[];
    size?: 'sm' | 'md';
    disabled?: boolean;
    class?: string;
    'aria-label'?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    items,
    size = 'md',
    disabled = false,
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();

  function select(item: SwatchItem) {
    if (disabled || item.disabled || item.value === value) return;
    value = item.value;
    onchange?.(item.value);
  }

  function roving(node: HTMLElement) {
    return rovingFocus(node, { selector: '.ca-swatch', orientation: 'horizontal' });
  }
</script>

<div
  role="radiogroup"
  aria-label={ariaLabel}
  aria-disabled={disabled ? 'true' : undefined}
  data-disabled={disabled ? '' : undefined}
  class="ca-swatch-group ca-swatch-group--{size} {className}"
  {@attach roving}
>
  {#each items as item (item.value)}
    {@const on = item.value === value}
    {@const off = disabled || !!item.disabled}
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={item.label ?? item.value}
      disabled={off}
      data-state={on ? 'on' : 'off'}
      data-disabled={off ? '' : undefined}
      data-preset={item.color ? undefined : item.value}
      class="ca-swatch"
      style={item.color ? `--ca-swatch-color:${item.color}` : undefined}
      onclick={() => select(item)}
    >
      {#if on}<Check size={size === 'sm' ? 12 : 14} stroke-width={3} aria-hidden="true" />{/if}
    </button>
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-swatch-group) {
      --ca-swatch-size: var(--ca-space-6);
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      /* The gap is the touch pad budget: two 44px pads never overlap when the gap plus the
         swatch is at least the pad. Under coarse pointers the swatch itself grows to it. */
      gap: var(--ca-space-2);
    }

    :global(.ca-swatch-group--sm) {
      --ca-swatch-size: var(--ca-space-5);
    }

    :global(.ca-swatch) {
      position: relative;
      display: inline-grid;
      place-items: center;
      inline-size: var(--ca-swatch-size);
      block-size: var(--ca-swatch-size);
      padding: 0;
      border: none;
      border-radius: var(--ca-radius-pill);
      background: var(--ca-swatch-color, var(--ca-brand-main));
      color: var(--ca-brand-contrast);
      cursor: pointer;
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-default);
      transition: box-shadow var(--ca-duration-fast) var(--ca-ease-standard);
    }

    /* A custom color has no preset to take a contrast color from. A white check with a dark halo
       stays legible on any fill, so no contrast math is needed. */
    :global(.ca-swatch[style*='--ca-swatch-color']) {
      color: #fff;
    }
    :global(.ca-swatch[style*='--ca-swatch-color'] svg) {
      filter: drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000);
    }

    :global(.ca-swatch[data-state='on']) {
      box-shadow:
        0 0 0 var(--ca-space-0-5) var(--ca-surface-base),
        0 0 0 calc(var(--ca-space-0-5) + var(--ca-border-width-focus)) var(--ca-text-primary);
    }

    :global(.ca-swatch:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-space-1);
    }

    /* A disabled swatch drops its color for the neutral disabled fill: opacity would still look pickable. */
    :global(.ca-swatch[disabled]) {
      cursor: not-allowed;
      background: var(--ca-action-disabled-bg);
      color: var(--ca-text-disabled);
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
    }

    /* Coarse pointers: the swatch itself is the 44px target, so neighbours can never overlap
       (an expanded ::after pad would, at this pitch). */
    @media (pointer: coarse) {
      :global(.ca-swatch-group) {
        gap: var(--ca-space-1);
      }
      :global(.ca-swatch) {
        inline-size: var(--ca-touch-target);
        block-size: var(--ca-touch-target);
        background-clip: content-box;
        padding: calc((var(--ca-touch-target) - var(--ca-swatch-size)) / 2);
      }
    }

    @media (forced-colors: active) {
      :global(.ca-swatch) {
        forced-color-adjust: none;
        box-shadow: 0 0 0 var(--ca-border-width) CanvasText;
      }
      :global(.ca-swatch[data-state='on']) {
        box-shadow:
          0 0 0 var(--ca-space-0-5) Canvas,
          0 0 0 calc(var(--ca-space-0-5) + var(--ca-border-width-focus)) Highlight;
      }
    }
}
</style>

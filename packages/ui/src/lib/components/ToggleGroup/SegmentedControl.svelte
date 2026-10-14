<script lang="ts">
  import { untrack } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import type { ToggleGroupItem } from './ToggleGroup.svelte';

  interface Props {
    value?: string;
    items: ToggleGroupItem[];
    size?: 'sm' | 'md';
    disabled?: boolean;
    fullWidth?: boolean;
    class?: string;
    'aria-label'?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(),
    items,
    size = 'md',
    disabled = false,
    fullWidth = false,
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();

  if (value === undefined) value = untrack(() => items.find((i) => !i.disabled)?.value ?? '');

  const index = $derived(items.findIndex((i) => i.value === value));

  // A segmented control always has a selection: pressing the active segment is a no-op.
  function select(item: ToggleGroupItem) {
    if (disabled || item.disabled || item.value === value) return;
    value = item.value;
    onchange?.(item.value);
  }

  function roving(node: HTMLElement) {
    return rovingFocus(node, { selector: '.ca-seg__item', orientation: 'horizontal' });
  }
</script>

<div
  role="group"
  aria-label={ariaLabel}
  data-orientation="horizontal"
  data-disabled={disabled ? '' : undefined}
  class="ca-seg ca-seg--{size} {className}"
  data-no-motion={reducedMotion.value ? '' : undefined}
  style="--seg-count:{items.length};--seg-index:{Math.max(index, 0)}"
  data-fullwidth={fullWidth ? '' : undefined}
  {@attach roving}
>
  {#if index >= 0}<span class="ca-seg__thumb" aria-hidden="true"></span>{/if}
  {#each items as item (item.value)}
    {@const on = item.value === value}
    {@const off = disabled || !!item.disabled}
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={item['aria-label']}
      disabled={off}
      data-state={on ? 'on' : 'off'}
      data-disabled={off ? '' : undefined}
      data-orientation="horizontal"
      class="ca-seg__item"
      onclick={() => select(item)}
    >
      {#if item.icon}
        {@const Icon = item.icon}
        <Icon size={size === 'sm' ? 14 : 16} stroke-width={2} />
      {/if}
      {#if item.label}<span>{item.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-seg) {
      --seg-pad: var(--ca-space-0-5);
      position: relative;
      display: inline-grid;
      grid-auto-flow: column;
      /* Equal columns that may shrink: in a narrow slot labels truncate instead of the
         control pushing past its container. */
      grid-auto-columns: minmax(0, 1fr);
      max-width: 100%;
      padding: var(--seg-pad);
      border-radius: var(--ca-radius-control);
      background: var(--ca-surface-raised);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      font-family: var(--ca-font-sans);
      isolation: isolate;
    }

    :global(.ca-seg[data-fullwidth]) {
      display: grid;
      width: 100%;
    }

    /* Thumb: one column wide, moved by whole-column steps (100% of its own width per index). */
    :global(.ca-seg__thumb) {
      position: absolute;
      z-index: 0;
      top: var(--seg-pad);
      bottom: var(--seg-pad);
      left: var(--seg-pad);
      width: calc((100% - 2 * var(--seg-pad)) / var(--seg-count));
      border-radius: calc(var(--ca-radius-control) - var(--ca-space-0-5));
      background: var(--ca-surface-overlay);
      box-shadow:
        var(--ca-shadow-sm),
        0 0 0 var(--ca-border-width) var(--ca-state-indicator);
      transform: translateX(calc(var(--seg-index) * 100%));
      transition: transform var(--ca-duration-base) var(--ca-ease-spring);
      pointer-events: none;
    }

    :global(.ca-seg[data-no-motion] .ca-seg__thumb) {
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      :global(.ca-seg__thumb) {
        transition: none;
      }
    }

    :global(.ca-seg__item) {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1-5);
      border: none;
      border-radius: calc(var(--ca-radius-control) - var(--ca-space-0-5));
      background: transparent;
      color: var(--ca-text-secondary);
      font-family: inherit;
      font-weight: var(--ca-font-weight-medium);
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-seg--sm .ca-seg__item) {
      height: calc(var(--ca-space-6) + var(--ca-space-0-5));
      padding: 0 var(--ca-space-3);
      font-size: var(--ca-font-size-caption);
    }

    :global(.ca-seg--md .ca-seg__item) {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-4);
      font-size: var(--ca-font-size-body2);
    }

    :global(.ca-seg__item:hover:not([disabled])) {
      color: var(--ca-text-primary);
    }

    :global(.ca-seg__item[data-state='on']) {
      color: var(--ca-brand-text);
    }

    :global(.ca-seg__item:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    :global(.ca-seg__item[disabled]),
    :global(.ca-seg__item[disabled][data-state='on']) {
      cursor: not-allowed;
      color: var(--ca-text-disabled);
    }

    @media (pointer: coarse) {
      :global(.ca-seg__item) {
        min-height: var(--ca-touch-target);
      }
    }
}
</style>

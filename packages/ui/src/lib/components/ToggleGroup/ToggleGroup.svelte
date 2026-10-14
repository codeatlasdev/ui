<script lang="ts" module>
  import type { IconComponent } from '../../types.js';

  export interface ToggleGroupItem {
    value: string;
    label?: string;
    icon?: IconComponent;
    disabled?: boolean;
    /** Required for icon-only items (no `label`). */
    'aria-label'?: string;
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';

  interface Props {
    type?: 'single' | 'multiple';
    /** `string` for type="single", `string[]` for type="multiple". */
    value?: string | string[];
    items: ToggleGroupItem[];
    size?: 'sm' | 'md';
    variant?: 'outlined' | 'ghost';
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    class?: string;
    'aria-label'?: string;
    onchange?: (value: string | string[]) => void;
  }

  let {
    type = 'single',
    value = $bindable(),
    items,
    size = 'md',
    variant = 'outlined',
    disabled = false,
    orientation = 'horizontal',
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();

  // Normalise bindable value so it always has the shape matching `type`.
  if (value === undefined) value = untrack(() => (type === 'multiple' ? [] : ''));

  const multiple = $derived(type === 'multiple');
  const selected = $derived(Array.isArray(value) ? value : value ? [value] : []);

  function toggle(item: ToggleGroupItem) {
    if (disabled || item.disabled) return;
    if (multiple) {
      const next = selected.includes(item.value)
        ? selected.filter((v) => v !== item.value)
        : // keep the order of `items`, not click order
          items.map((i) => i.value).filter((v) => v === item.value || selected.includes(v));
      value = next;
      onchange?.(next);
    } else {
      // Pressing the active item again clears a single group.
      const next = selected[0] === item.value ? '' : item.value;
      value = next;
      onchange?.(next);
    }
  }

  // Single groups are radios (one tab stop, arrows move focus); multiple are independent
  // toggle buttons that each stay in the tab order.
  function roving(node: HTMLElement) {
    if (multiple) return;
    return rovingFocus(node, { selector: '.ca-toggle-group__item', orientation });
  }
</script>

{#snippet content(item: ToggleGroupItem)}
  {#if item.icon}
    {@const Icon = item.icon}
    <Icon size={size === 'sm' ? 14 : 16} stroke-width={2} />
  {/if}
  {#if item.label}<span>{item.label}</span>{/if}
{/snippet}

<div
  role="group"
  aria-label={ariaLabel}
  data-orientation={orientation}
  data-disabled={disabled ? '' : undefined}
  class="ca-toggle-group ca-toggle-group--{variant} ca-toggle-group--{size} {className}"
  {@attach roving}
>
  {#each items as item (item.value)}
    {@const on = selected.includes(item.value)}
    {@const off = disabled || !!item.disabled}
    <button
      type="button"
      role={multiple ? undefined : 'radio'}
      aria-checked={multiple ? undefined : on}
      aria-pressed={multiple ? on : undefined}
      aria-label={item['aria-label']}
      disabled={off}
      data-state={on ? 'on' : 'off'}
      data-disabled={off ? '' : undefined}
      data-orientation={orientation}
      class="ca-toggle-group__item"
      onclick={() => toggle(item)}
    >
      {@render content(item)}
    </button>
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-toggle-group) {
      display: inline-flex;
      align-items: stretch;
      gap: var(--ca-space-0-5);
      font-family: var(--ca-font-sans);
    }

    :global(.ca-toggle-group[data-orientation='vertical']) {
      flex-direction: column;
    }

    :global(.ca-toggle-group--outlined) {
      padding: var(--ca-space-0-5);
      border-radius: var(--ca-radius-control);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      background: var(--ca-surface-raised);
    }

    :global(.ca-toggle-group__item) {
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
      cursor: pointer;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-toggle-group--sm .ca-toggle-group__item) {
      height: calc(var(--ca-space-6) + var(--ca-space-0-5));
      padding: 0 var(--ca-space-2-5);
      font-size: var(--ca-font-size-caption);
    }

    :global(.ca-toggle-group--md .ca-toggle-group__item) {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-3-5);
      font-size: var(--ca-font-size-body2);
    }

    :global(.ca-toggle-group__item:hover:not([disabled]):not([data-state='on'])) {
      background: color-mix(in oklab, var(--ca-brand-main) 8%, transparent);
      color: var(--ca-text-primary);
    }

    :global(.ca-toggle-group__item[data-state='on']) {
      background: color-mix(in oklab, var(--ca-brand-main) 14%, transparent);
      /* Plain brand-main on its own 14% tint is 4.13:1 in light mode; blend toward body text to clear AA. */
      color: color-mix(in oklab, var(--ca-brand-main) 75%, var(--ca-text-primary));
    }

    :global(.ca-toggle-group__item:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    :global(.ca-toggle-group__item[disabled]) {
      cursor: not-allowed;
      color: var(--ca-text-disabled);
    }
    :global(.ca-toggle-group__item[disabled][data-state='on']) {
      background: var(--ca-action-disabled-bg);
      color: var(--ca-text-disabled);
    }

    @media (pointer: coarse) {
      :global(.ca-toggle-group__item) {
        min-height: var(--ca-touch-target);
      }
    }
}
</style>

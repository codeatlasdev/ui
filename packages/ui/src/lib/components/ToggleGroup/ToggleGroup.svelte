<script lang="ts" module>
  import type { IconComponent } from '../../types.js';

  /** `T`: the option values, e.g. a literal union (`'list' | 'grid'`); `string` when omitted (#1235). */
  export interface ToggleGroupItem<T extends string = string> {
    value: T;
    label?: string;
    icon?: IconComponent;
    disabled?: boolean;
    /** Required for icon-only items (no `label`). */
    'aria-label'?: string;
  }
</script>

<script lang="ts" generics="T extends string = string">
  import { untrack } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';
  import './toggle-group.css';

  interface Common {
    items: ToggleGroupItem<T>[];
    size?: 'sm' | 'md';
    variant?: 'outlined' | 'ghost';
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    /**
     * Keep a selection: pressing the pressed item (the last one, for `multiple`) does nothing
     * instead of clearing it, like a radio group. An empty group still selects on the first press.
     */
    required?: boolean;
    class?: string;
    'aria-label'?: string;
  }
  /**
   * `T` is inferred from `items`, so a literal union (`'list' | 'grid'`) stays narrow (#1235).
   * `single`: `value` is one `T`, or `''` once the pressed item is pressed again (not with `required`).
   * `multiple`: `value` is the pressed `T[]`, in the order of `items`.
   * The first branch (both shapes) is what a `type` only known at run time gets.
   */
  type Props = Common &
    (
      | {
          /** `single` (radios, one tab stop) or `multiple` (independent toggle buttons). */
          type?: 'single' | 'multiple';
          /** Bindable. `T` for single (`''` once cleared), `T[]` for multiple. */
          value?: T | '' | T[];
          onchange?: (value: T | '' | T[]) => void;
        }
      | { type?: 'single'; value?: T | ''; onchange?: (value: T | '') => void }
      | { type: 'multiple'; value?: T[]; onchange?: (value: T[]) => void }
    );

  let {
    type = 'single',
    value = $bindable(),
    items,
    size = 'md',
    variant = 'outlined',
    disabled = false,
    orientation = 'horizontal',
    required = false,
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();
  // The union is for callers; inside, one callback shape for both modes.
  const emit = (next: T | '' | T[]) => (onchange as ((v: T | '' | T[]) => void) | undefined)?.(next);

  // Normalise bindable value so it always has the shape matching `type`.
  if (value === undefined) value = untrack(() => (type === 'multiple' ? [] : ''));

  const multiple = $derived(type === 'multiple');
  const selected = $derived(Array.isArray(value) ? value : value ? [value] : []);

  function toggle(item: ToggleGroupItem<T>) {
    if (disabled || item.disabled) return;
    if (required && selected.length === 1 && selected[0] === item.value) return;
    if (multiple) {
      const next = selected.includes(item.value)
        ? selected.filter((v) => v !== item.value)
        : // keep the order of `items`, not click order
          items.map((i) => i.value).filter((v) => v === item.value || selected.includes(v));
      value = next;
      emit(next);
    } else {
      // Pressing the active item again clears a single group (unless `required`, returned above).
      const next: T | '' = selected[0] === item.value ? '' : item.value;
      value = next;
      emit(next);
    }
  }

  // Single groups are radios (one tab stop, arrows move focus); multiple are independent
  // toggle buttons that each stay in the tab order.
  function roving(node: HTMLElement) {
    if (multiple) return;
    return rovingFocus(node, { selector: '.ca-toggle-group__item', orientation });
  }
</script>

{#snippet content(item: ToggleGroupItem<T>)}
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

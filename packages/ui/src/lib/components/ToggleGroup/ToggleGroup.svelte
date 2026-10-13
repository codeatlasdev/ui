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
  import { ToggleGroup } from 'bits-ui';

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

  // Normalise bindable value so bits-ui always receives the shape matching `type`.
  if (value === undefined) value = untrack(() => (type === 'multiple' ? [] : ''));
</script>

{#snippet content(item: ToggleGroupItem)}
  {#if item.icon}
    {@const Icon = item.icon}
    <Icon size={size === 'sm' ? 14 : 16} stroke-width={2} />
  {/if}
  {#if item.label}<span>{item.label}</span>{/if}
{/snippet}

{#if type === 'multiple'}
  <ToggleGroup.Root
    type="multiple"
    bind:value={value as string[]}
    {disabled}
    {orientation}
    aria-label={ariaLabel}
    onValueChange={(v) => onchange?.(v)}
    class="ca-toggle-group ca-toggle-group--{variant} ca-toggle-group--{size} {className}"
  >
    {#each items as item (item.value)}
      <ToggleGroup.Item
        value={item.value}
        disabled={item.disabled}
        aria-label={item['aria-label']}
        class="ca-toggle-group__item"
      >
        {@render content(item)}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
{:else}
  <ToggleGroup.Root
    type="single"
    bind:value={value as string}
    {disabled}
    {orientation}
    aria-label={ariaLabel}
    onValueChange={(v) => onchange?.(v)}
    class="ca-toggle-group ca-toggle-group--{variant} ca-toggle-group--{size} {className}"
  >
    {#each items as item (item.value)}
      <ToggleGroup.Item
        value={item.value}
        disabled={item.disabled}
        aria-label={item['aria-label']}
        class="ca-toggle-group__item"
      >
        {@render content(item)}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
{/if}

<style>
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
    outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
    outline-offset: var(--ca-focus-ring-offset);
  }

  :global(.ca-toggle-group__item[disabled]) {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (pointer: coarse) {
    :global(.ca-toggle-group__item) {
      min-height: var(--ca-touch-target);
    }
  }
</style>

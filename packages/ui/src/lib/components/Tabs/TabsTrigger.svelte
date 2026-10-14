<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getTabsContext, idKey } from './tabs-context.js';

  interface Props {
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { value, disabled = false, class: className = '', children }: Props = $props();

  const tabs = getTabsContext();
  const active = $derived(tabs.value === value);
</script>

<button
  type="button"
  role="tab"
  id={tabs.ids.item('tab', idKey(value))}
  aria-selected={active}
  aria-controls={tabs.ids.item('panel', idKey(value))}
  {disabled}
  data-state={active ? 'active' : 'inactive'}
  data-value={value}
  data-orientation="horizontal"
  data-disabled={disabled ? '' : undefined}
  class="ca-tabs-trigger {className}"
  onclick={() => tabs.select(value)}
  onfocus={() => tabs.select(value)}
>
  {@render children?.()}
</button>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tabs-trigger) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-3-5);
      border-radius: var(--ca-radius-pill);
      border: none;
      background: transparent;
      color: var(--ca-text-secondary);
      font-family: var(--ca-font-sans);
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      cursor: pointer;
      white-space: nowrap;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-tabs-trigger:hover:not([disabled])) {
      color: var(--ca-text-primary);
      background: var(--ca-action-hover);
    }

    :global(.ca-tabs-trigger[data-state='active']) {
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }

    :global(.ca-tabs-trigger[disabled]) {
      color: var(--ca-text-disabled);
      cursor: not-allowed;
    }
    :global(.ca-tabs-trigger[disabled][data-state='active']) {
      background: var(--ca-action-disabled-bg);
      color: var(--ca-text-disabled);
    }

    :global(.ca-tabs-trigger:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
    }

    @media (pointer: coarse) {
      :global(.ca-tabs-trigger) {
        height: auto;
        min-height: var(--ca-touch-target);
      }
    }
}
</style>

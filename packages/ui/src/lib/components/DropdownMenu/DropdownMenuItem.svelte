<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { MENU_CONTEXT, type MenuContext } from './menu-context.js';

  interface Props {
    class?: string;
    onclick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    children?: Snippet;
  }

  let { class: className = '', onclick, disabled = false, variant = 'default', children }: Props = $props();

  const menu = getContext<MenuContext | undefined>(MENU_CONTEXT);
  let highlighted = $state(false);

  function select() {
    if (disabled) return;
    onclick?.();
    menu?.close();
  }
</script>

<!-- Enter/Space are handled by the menu's keydown (roving focus), which clicks the focused item. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  role="menuitem"
  tabindex="-1"
  class="ca-dropdown-item ca-dropdown-item--{variant} {className}"
  aria-disabled={disabled ? 'true' : undefined}
  data-disabled={disabled ? '' : undefined}
  data-highlighted={highlighted ? '' : undefined}
  onclick={select}
  onfocus={() => (highlighted = true)}
  onblur={() => (highlighted = false)}
  onpointermove={(e) => {
    if (!disabled && e.currentTarget !== document.activeElement) e.currentTarget.focus({ preventScroll: true });
  }}
>
  {@render children?.()}
</div>

<style>
  :global(.ca-dropdown-item) {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2);
    height: var(--ca-control-height);
    padding: 0 var(--ca-space-3);
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    cursor: pointer;
    outline: none;
    user-select: none;
  }
  :global(.ca-dropdown-item[data-highlighted]) {
    background: var(--ca-action-hover);
    color: var(--ca-text-primary);
  }
  :global(.ca-dropdown-item[data-disabled]) {
    color: var(--ca-text-disabled);
    cursor: default;
    pointer-events: none;
  }
  :global(.ca-dropdown-item--destructive) {
    color: var(--ca-semantic-error);
  }
  :global(.ca-dropdown-item--destructive[data-highlighted]) {
    background: color-mix(in oklab, var(--ca-semantic-error) 10%, transparent);
    color: color-mix(in oklab, var(--ca-semantic-error) 65%, black);
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { Check } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { MENU_CONTEXT, type MenuContext } from './menu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onclick' | 'role' | 'tabindex'> {
    class?: string;
    /** Whether the item is checked. Bindable. */
    checked?: boolean;
    /** Called with the new state when the user toggles the item. */
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    /** Close the menu after toggling. Default false: the menu stays open so several options can be set (APG). */
    closeOnSelect?: boolean;
    children?: Snippet;
  }

  let {
    class: className = '',
    checked = $bindable(false),
    onCheckedChange,
    disabled = false,
    closeOnSelect = false,
    children,
    ...rest
  }: Props = $props();

  const menu = getContext<MenuContext | undefined>(MENU_CONTEXT);
  let highlighted = $state(false);

  function select() {
    if (disabled) return;
    checked = !checked;
    onCheckedChange?.(checked);
    if (closeOnSelect) menu?.close();
  }
</script>

<!-- Enter/Space are handled by the menu's keydown (roving focus), which clicks the focused item. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  {...rest}
  role="menuitemcheckbox"
  tabindex="-1"
  class="ca-dropdown-item ca-dropdown-item--default ca-dropdown-item--selectable {className}"
  aria-checked={checked}
  aria-disabled={disabled ? 'true' : undefined}
  data-state={checked ? 'checked' : 'unchecked'}
  data-disabled={disabled ? '' : undefined}
  data-highlighted={highlighted ? '' : undefined}
  onclick={select}
  onfocus={() => (highlighted = true)}
  onblur={() => (highlighted = false)}
  onpointermove={(e) => {
    if (!disabled && e.currentTarget !== document.activeElement) e.currentTarget.focus({ preventScroll: true });
  }}
>
  <span class="ca-dropdown-item__indicator" aria-hidden="true">{#if checked}<Check size={14} />{/if}</span>
  {@render children?.()}
</div>

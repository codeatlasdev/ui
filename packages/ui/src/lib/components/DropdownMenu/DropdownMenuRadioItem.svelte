<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { Circle } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    MENU_CONTEXT,
    RADIO_GROUP_CONTEXT,
    type MenuContext,
    type RadioGroupContext,
  } from './menu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onclick' | 'role' | 'tabindex'> {
    class?: string;
    /** Value this item sets on its `DropdownMenuRadioGroup`. */
    value: string;
    disabled?: boolean;
    /** Close the menu after picking. Default false: the menu stays open (APG). */
    closeOnSelect?: boolean;
    children?: Snippet;
  }

  let {
    class: className = '',
    value,
    disabled = false,
    closeOnSelect = false,
    children,
    ...rest
  }: Props = $props();

  const menu = getContext<MenuContext | undefined>(MENU_CONTEXT);
  const group = getContext<RadioGroupContext | undefined>(RADIO_GROUP_CONTEXT);
  const checked = $derived(group?.value === value);
  let highlighted = $state(false);

  function select() {
    if (disabled) return;
    group?.select(value);
    if (closeOnSelect) menu?.close();
  }
</script>

<!-- Enter/Space are handled by the menu's keydown (roving focus), which clicks the focused item. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  {...rest}
  role="menuitemradio"
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
  <span class="ca-dropdown-item__indicator" aria-hidden="true">{#if checked}<Circle size={6} fill="currentColor" />{/if}</span>
  {@render children?.()}
</div>

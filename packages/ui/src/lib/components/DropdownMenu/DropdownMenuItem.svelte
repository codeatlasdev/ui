<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import './dropdown-item.css';
  import { MENU_CONTEXT, type MenuContext } from './menu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onclick' | 'role' | 'tabindex'> {
    class?: string;
    onclick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    /** Leading icon in a fixed box (`aria-hidden`, so the label stays the accessible name). */
    icon?: Snippet;
    /**
     * The icon is a brand mark (fixed colors, not a `currentColor` glyph): it is never recolored
     * by the highlighted, disabled or destructive state. Pair with `SchemeAsset` for light/dark variants.
     */
    brandIcon?: boolean;
    children?: Snippet;
  }

  let {
    class: className = '',
    onclick,
    disabled = false,
    variant = 'default',
    icon,
    brandIcon = false,
    children,
    ...rest
  }: Props = $props();

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
  {...rest}
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
  {#if icon}
    <span class="ca-dropdown-item__icon" data-brand={brandIcon ? '' : undefined} aria-hidden="true">{@render icon()}</span>
  {/if}
  {@render children?.()}
</div>

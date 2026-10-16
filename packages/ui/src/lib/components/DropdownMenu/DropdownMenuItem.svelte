<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { MENU_CONTEXT, type MenuContext } from './menu-context.js';

  interface Props {
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

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
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
    /* Fixed icon box: size, gap and alignment never drift between menus. A brand mark keeps its
       own colors (data-brand): no state color reaches it, so it is never tinted or dimmed. */
    :global(.ca-dropdown-item__icon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      inline-size: var(--ca-space-3-5);
      block-size: var(--ca-space-3-5);
    }
    :global(.ca-dropdown-item__icon > :is(svg, img)) {
      inline-size: 100%;
      block-size: 100%;
    }
    :global(.ca-dropdown-item__icon[data-brand]) {
      color: initial;
      opacity: 1;
    }
    :global(.ca-dropdown-item--destructive) {
      color: var(--ca-semantic-error);
    }
    :global(.ca-dropdown-item--destructive[data-highlighted]) {
      background: color-mix(in oklab, var(--ca-semantic-error) 10%, transparent);
      color: color-mix(in oklab, var(--ca-semantic-error) 65%, black);
    }
}
</style>

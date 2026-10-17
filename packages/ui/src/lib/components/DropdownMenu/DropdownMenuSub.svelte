<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext, setContext } from 'svelte';
  import { createHoverIntent, createListbox } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import {
    MENU_CONTEXT,
    SUB_MENU_CONTEXT,
    type MenuContext,
    type SubMenuContext,
  } from './menu-context.js';
  import { ownItems } from './menu-items.js';

  interface Props {
    class?: string;
    /** The `DropdownMenuSubTrigger` item that opens this submenu. */
    trigger: Snippet;
    /** Submenu content: items, labels, separators and further `DropdownMenuSub`s. */
    children?: Snippet;
    /** Bindable. Whether the submenu is open. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    /** Milliseconds the pointer must rest on the trigger before the submenu opens. */
    openDelay?: number;
    /** Milliseconds the submenu stays open after the pointer leaves, so it can cross into it. */
    closeDelay?: number;
  }

  let {
    class: className = '',
    trigger,
    children,
    open = $bindable(false),
    onOpenChange,
    disabled = false,
    side = 'right',
    align = 'start',
    sideOffset = 2,
    openDelay = 120,
    closeDelay = 200,
  }: Props = $props();

  const parent = getContext<MenuContext | undefined>(MENU_CONTEXT);
  const id = uid('submenu');
  const contentId = `${id}-content`;
  const triggerId = `${id}-trigger`;
  let anchor = $state<HTMLElement | null>(null);
  let menu = $state<HTMLElement | null>(null);

  function setOpen(next: boolean) {
    if (next && disabled) return;
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

  // `createHoverIntent` takes fixed delays: rebuild it when a delay prop changes.
  const intent = $derived.by(() => createHoverIntent({ openDelay, closeDelay, onOpenChange: setOpen }));

  const listbox = createListbox({
    mode: 'roving',
    items: () =>
      ownItems(menu).map((el, i) => ({
        id: el.id || `${id}-item-${i}`,
        el: () => el,
        text: el.textContent ?? '',
        disabled: el.hasAttribute('data-disabled'),
      })),
    onSelect: (item) => item.el()?.click(),
  });

  let pendingFocus: 'first' | 'none' = 'none';

  /** Closes this level only; `restoreFocus` returns focus to the trigger item. */
  function hide(restoreFocus = true) {
    intent.set(false);
    listbox.clear();
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }

  setContext<SubMenuContext>(SUB_MENU_CONTEXT, {
    get open() {
      return open;
    },
    get disabled() {
      return disabled;
    },
    contentId,
    triggerId,
    setAnchor: (el) => (anchor = el),
    show(focus) {
      if (disabled) return;
      pendingFocus = focus;
      intent.set(true);
    },
    hide: () => hide(true),
    hoverEnter: () => {
      if (!disabled) intent.enter();
    },
    hoverLeave: () => intent.leave(),
  });

  // A pointer resting inside the submenu keeps it open; leaving it (to anywhere but the trigger) closes.
  const keepOpen = () => intent.enter();
  const leave = () => intent.leave();

  $effect(() => {
    const current = intent;
    return () => current.destroy();
  });

  // The layer is already shown when this runs, so focus moves in the same task as the open: a
  // key typed right after ArrowRight must reach the submenu, not the trigger it came from.
  function onMounted() {
    if (pendingFocus === 'first') listbox.first();
  }

  function onkeydown(e: KeyboardEvent) {
    // Keys pressed inside a submenu belong to it alone: the parent menu must not also move.
    e.stopPropagation();
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      hide(true);
      return;
    }
    if (e.key === 'Tab') {
      parent?.closeAll();
      return;
    }
    const items = listbox.items;
    const active = items.findIndex((it) => it.el() === document.activeElement);
    if (active >= 0 && active !== listbox.highlightedIndex) listbox.highlightedIndex = active;
    listbox.onkeydown(e);
  }

  // Selecting an item inside a submenu closes every level, not just this one; Escape and ArrowLeft
  // (above) close only this level through `hide`.
  setContext<MenuContext>(MENU_CONTEXT, {
    close: () => parent?.closeAll(),
    closeAll: () => parent?.closeAll(),
  });
</script>

{@render trigger()}

<FloatingLayer
  {anchor}
  {open}
  {side}
  {align}
  {sideOffset}
  bind:ref={menu}
  id={contentId}
  role="menu"
  aria-labelledby={triggerId}
  aria-orientation="vertical"
  tabindex={-1}
  class="ca-dropdown-content ca-dropdown-sub glass-overlay {className}"
  exclude={() => (anchor ? [anchor] : [])}
  onDismiss={(reason) => {
    if (reason === 'escape') hide(true);
    else if (reason === 'outside') hide(false);
  }}
  onpointerenter={keepOpen}
  onpointerleave={leave}
  {onkeydown}
  {onMounted}
>
  {@render children?.()}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-dropdown-sub) {
      transform-origin: top left;
    }
}
</style>

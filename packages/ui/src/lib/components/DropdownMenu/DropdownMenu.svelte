<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { createListbox } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { createTriggerProps } from '../Popover/trigger.js';
  import { MENU_CONTEXT } from './menu-context.js';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the menu's own button. */
    trigger?: Snippet;
    /** Interactive trigger (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
    children?: Snippet;
    side?:       'top' | 'right' | 'bottom' | 'left';
    align?:      'start' | 'center' | 'end';
    sideOffset?: number;
  }

  let {
    class: className = '',
    trigger,
    triggerChild,
    children,
    side       = 'bottom',
    align      = 'start',
    sideOffset = 6,
  }: Props = $props();

  const id = uid('menu');
  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let menu = $state<HTMLElement | null>(null);

  const ALL_ITEMS = '[role="menuitem"], [role="menuitemcheckbox"]';

  const listbox = createListbox({
    mode: 'roving',
    items: () =>
      Array.from(menu?.querySelectorAll<HTMLElement>(ALL_ITEMS) ?? []).map((el, i) => ({
        id: el.id || `${id}-item-${i}`,
        el: () => el,
        text: el.textContent ?? '',
        disabled: el.hasAttribute('data-disabled'),
      })),
    onSelect: (item) => item.el()?.click(),
  });

  function close(restoreFocus = true) {
    open = false;
    listbox.clear();
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }

  setContext(MENU_CONTEXT, { close });

  /** Opens the menu; `focus` picks which item (or the container) receives focus. */
  let pendingFocus: 'first' | 'last' | 'container' = 'container';
  function openWith(focus: typeof pendingFocus) {
    pendingFocus = focus;
    open = true;
  }

  const makeTrigger = createTriggerProps((el) => (anchor = el));
  const triggerAttrs = $derived(
    makeTrigger({
      id: `${id}-trigger`,
      popup: 'menu',
      open,
      controls: `${id}-content`,
      // Pointer clicks leave focus on the menu container; keyboard opens go to an item.
      onToggle: () => (open ? close() : openWith('container')),
      onKeydown: (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!open) openWith('first');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (!open) openWith('last');
        }
      },
    })
  );

  function onMounted(el: HTMLElement) {
    // Wait a frame so items are rendered/positioned before moving focus. FloatingLayer runs the
    // returned cleanup on close, so a close landing before the frame cannot be undone by it.
    const frame = requestAnimationFrame(() => {
      if (pendingFocus === 'first') listbox.first();
      else if (pendingFocus === 'last') listbox.last();
      else el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      // Tabbing out of a menu closes it (APG); focus continues from the trigger.
      close();
      return;
    }
    // Keep the highlight in step when the user focused an item with the pointer.
    const items = listbox.items;
    const active = items.findIndex((it) => it.el() === document.activeElement);
    if (active >= 0 && active !== listbox.highlightedIndex) listbox.highlightedIndex = active;
    listbox.onkeydown(e);
  }
</script>

{#if triggerChild}
  {@render triggerChild(triggerAttrs)}
{:else if trigger}
  <button type="button" class="ca-dropdown__trigger" {...triggerAttrs}>
    {@render trigger()}
  </button>
{/if}

<FloatingLayer
  {anchor}
  {open}
  {side}
  {align}
  {sideOffset}
  bind:ref={menu}
  id="{id}-content"
  role="menu"
  aria-labelledby="{id}-trigger"
  aria-orientation="vertical"
  tabindex={-1}
  class="ca-dropdown-content glass-overlay {className}"
  onDismiss={(reason) => close(reason === 'escape')}
  {onkeydown}
  {onMounted}
>
  {@render children?.()}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-dropdown__trigger) {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
    }

    :global(.ca-dropdown-content) {
      border-radius: var(--ca-radius-lg);
      padding: var(--ca-space-1);
      min-width: 160px;
      outline: none;
      animation: ca-dropdown-in var(--ca-duration-fast) var(--ca-ease-decelerate);
      transform-origin: top left;
    }

    :global(.ca-dropdown-content[data-side='top']) { transform-origin: bottom left; }
    :global(.ca-dropdown-content[data-align='end']) { transform-origin: top right; }
    :global(.ca-dropdown-content[data-side='top'][data-align='end']) { transform-origin: bottom right; }

    :global(.ca-dropdown-content[data-state='closed']) {
      animation: ca-dropdown-out var(--ca-duration-fast) var(--ca-ease-standard);
    }

    @keyframes ca-dropdown-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes ca-dropdown-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.96); }
    }
}
</style>

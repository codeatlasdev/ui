<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { createListbox } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { createTriggerProps } from '../Popover/trigger.js';
  import { MENU_CONTEXT } from './menu-context.js';
  import { ownItems } from './menu-items.js';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the menu's own button. */
    trigger?: Snippet;
    /** Interactive trigger (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
    children?: Snippet;
    /** Bindable. Whether the menu is open. */
    open?: boolean;
    /** Called when the user opens or closes the menu (not when the bound value is set from code). */
    onOpenChange?: (open: boolean) => void;
    /**
     * Viewport point (`clientX`/`clientY`) the menu opens at, for a context menu. Set it together with
     * `open = true`; changing it while the menu is open moves the menu instead of toggling it.
     * Without `trigger`/`triggerChild` the menu has no button of its own.
     */
    anchor?: { x: number; y: number } | null;
    side?:       'top' | 'right' | 'bottom' | 'left';
    align?:      'start' | 'center' | 'end';
    sideOffset?: number;
  }

  let {
    class: className = '',
    trigger,
    triggerChild,
    children,
    open = $bindable(false),
    onOpenChange,
    anchor: point = null,
    side       = 'bottom',
    align      = 'start',
    sideOffset,
  }: Props = $props();

  const id = uid('menu');
  /** The trigger button, or the zero-size marker at `point` when the menu is opened at a point. */
  let triggerEl = $state<HTMLElement | null>(null);
  let marker = $state<HTMLElement | null>(null);
  const anchorEl = $derived(point ? marker : triggerEl);
  let menu = $state<HTMLElement | null>(null);
  /** What had focus when the menu opened without a trigger: Escape hands focus back to it. */
  let opener: HTMLElement | null = null;

  function setOpen(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

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

  function close(restoreFocus = true) {
    setOpen(false);
    listbox.clear();
    if (restoreFocus) (point ? opener : triggerEl)?.focus({ preventScroll: true });
  }

  setContext(MENU_CONTEXT, { close, closeAll: close });

  /** Opens the menu; `focus` picks which item (or the container) receives focus. */
  let pendingFocus: 'first' | 'last' | 'container' = 'container';
  function openWith(focus: typeof pendingFocus) {
    pendingFocus = focus;
    setOpen(true);
  }

  // Opened from code (`open = true`, usually with `anchor`): remember where focus was and start on
  // the first item, like a keyboard open. A trigger open sets `pendingFocus` itself before this runs.
  let wasOpen = false;
  let triggerOpened = false;
  $effect(() => {
    const now = open;
    if (now && !wasOpen) {
      const active = document.activeElement;
      opener = active instanceof HTMLElement && active !== document.body ? active : null;
      if (!triggerOpened) pendingFocus = 'first';
    }
    triggerOpened = false;
    wasOpen = now;
  });

  const makeTrigger = createTriggerProps((el) => (triggerEl = el));
  const triggerAttrs = $derived(
    makeTrigger({
      id: `${id}-trigger`,
      popup: 'menu',
      open,
      controls: `${id}-content`,
      // Pointer clicks leave focus on the menu container; keyboard opens go to an item.
      onToggle: () => {
        if (open) close();
        else {
          triggerOpened = true;
          openWith('container');
        }
      },
      onKeydown: (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!open) {
            triggerOpened = true;
            openWith('first');
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (!open) {
            triggerOpened = true;
            openWith('last');
          }
        } else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          e.preventDefault();
          if (!open) {
            triggerOpened = true;
            openWith('first');
          }
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

{#if point}
  <!-- Zero-size anchor at the pointer: the layer engine positions against an element. `style:` directives
       touch only their own property: a `style` attribute would be rewritten and wipe the engine's `anchor-name`. -->
  <span
    bind:this={marker}
    class="ca-dropdown__point"
    aria-hidden="true"
    style:--ca-point-x="{point.x}px"
    style:--ca-point-y="{point.y}px"
  ></span>
{/if}

<FloatingLayer
  anchor={anchorEl}
  {open}
  {side}
  {align}
  sideOffset={sideOffset ?? (point ? 0 : 6)}
  bind:ref={menu}
  id="{id}-content"
  role="menu"
  aria-labelledby={trigger || triggerChild ? `${id}-trigger` : undefined}
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

    /* The pointer anchor of a menu opened at a point: fixed, no size, never painted or hit. */
    :global(.ca-dropdown__point) {
      position: fixed;
      inset-inline-start: var(--ca-point-x);
      inset-block-start: var(--ca-point-y);
      inline-size: 0;
      block-size: 0;
      pointer-events: none;
    }

    :global(.ca-dropdown-content) {
      border-radius: var(--ca-radius-lg);
      padding: var(--ca-space-1);
      min-width: 160px;
      outline: none;
      animation: ca-dropdown-in var(--ca-enter-fast) var(--ca-ease-decelerate);
      transform-origin: top left;
    }

    :global(.ca-dropdown-content[data-side='top']) { transform-origin: bottom left; }
    :global(.ca-dropdown-content[data-align='end']) { transform-origin: top right; }
    :global(.ca-dropdown-content[data-side='top'][data-align='end']) { transform-origin: bottom right; }

    :global(.ca-dropdown-content[data-state='closed']) {
      animation: ca-dropdown-out var(--ca-enter-fast) var(--ca-ease-standard);
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

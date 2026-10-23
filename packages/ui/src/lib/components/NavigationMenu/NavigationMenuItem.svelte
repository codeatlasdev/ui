<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext, setContext } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { focusables } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { NAVMENU_CONTEXT, NAVMENU_PANEL_CONTEXT, type NavMenuContext } from './navmenu-context.js';

  interface Props {
    class?: string;
    /** Text of the disclosure button. */
    label: string;
    /** Panel content: `NavigationMenuLink`s, or any links and text. */
    children?: Snippet;
    /** Class on the panel. */
    panelClass?: string;
    align?: 'start' | 'center' | 'end';
  }

  let { class: className = '', label, children, panelClass = '', align = 'start' }: Props = $props();

  const nav = getContext<NavMenuContext | undefined>(NAVMENU_CONTEXT);
  if (!nav) throw new Error('NavigationMenuItem must be used inside a NavigationMenu');
  setContext(NAVMENU_PANEL_CONTEXT, true);

  const id = uid('navmenu');
  const open = $derived(nav.openId === id);
  let button = $state<HTMLElement | null>(null);
  let panel = $state<HTMLElement | null>(null);

  const key = createAttachmentKey();
  const attach = (node: HTMLElement) => {
    button = node;
    return () => (button = null);
  };

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      nav?.set(null);
    } else if (e.key === 'ArrowDown') {
      // Open and step into the panel: a disclosure is not a menu, but Down is the usual way in.
      e.preventDefault();
      e.stopPropagation();
      nav?.set(id);
      requestAnimationFrame(() => (panel ? focusables(panel)[0]?.focus() : undefined));
    } else if (e.key === 'Tab' && !e.shiftKey && open && panel) {
      // The panel is portaled to the top layer, so natural Tab order would skip it.
      const first = focusables(panel)[0];
      if (first) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onPanelKeydown(e: KeyboardEvent) {
    const links = panel ? focusables(panel) : [];
    const i = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? links[i + 1] : links[i - 1];
      next?.focus();
    } else if (e.key === 'Tab') {
      // Leaving the panel from its last link goes on to the next top-level item; from the first, back to the button.
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        nav?.set(null);
        button?.focus({ preventScroll: true });
      } else if (!e.shiftKey && i === links.length - 1) {
        nav?.set(null);
        const items = Array.from(
          button?.closest('ul')?.querySelectorAll<HTMLElement>('[data-ca-navmenu-item]') ?? []
        );
        const next = items[items.indexOf(button as HTMLElement) + 1];
        if (next) {
          e.preventDefault();
          next.tabIndex = 0;
          next.focus();
        }
      }
    }
  }

  const triggerAttrs = $derived({
    id: `${id}-button`,
    'aria-expanded': open,
    'aria-controls': open ? `${id}-panel` : undefined,
    'data-state': open ? 'open' : 'closed',
    'data-ca-navmenu-item': '',
    [key]: attach,
  });

  // Hover opens only on real pointer movement: a panel that mounts under a resting cursor stays shut. Touch uses the click.
  let armed = true;
  // A click that lands right after hover opened this panel confirms it instead of toggling it shut.
  let hoverOpenedAt = 0;
  const HOVER_CLICK_GRACE_MS = 600;
  function onclick() {
    if (open && performance.now() - hoverOpenedAt < HOVER_CLICK_GRACE_MS) {
      hoverOpenedAt = 0;
      return;
    }
    nav?.set(open ? null : id);
  }
</script>

<li class="ca-navmenu__entry">
  <button
    {...triggerAttrs}
    type="button"
    class="ca-navmenu__trigger {className}"
    {onclick}
    {onkeydown}
    onpointermove={(e) => {
      if (e.pointerType === 'touch' || !armed) return;
      armed = false;
      if (!open) hoverOpenedAt = performance.now();
      nav.enter(id);
    }}
    onpointerleave={(e) => {
      armed = true;
      if (e.pointerType !== 'touch') nav.leave();
    }}
  >
    {label}
    <ChevronDown class="ca-navmenu__chevron" size={14} aria-hidden="true" />
  </button>
</li>

<FloatingLayer
  anchor={button}
  {open}
  side="bottom"
  {align}
  sideOffset={6}
  bind:ref={panel}
  id="{id}-panel"
  role="group"
  aria-labelledby="{id}-button"
  class="ca-navmenu-panel glass-overlay {panelClass}"
  exclude={() => (button ? [button] : [])}
  onDismiss={(reason) => {
    nav?.set(null);
    // Escape hands focus back to the button; an outside press leaves it where the press put it.
    if (reason === 'escape') button?.focus({ preventScroll: true });
  }}
  onkeydown={onPanelKeydown}
  onpointerenter={() => nav?.keep()}
  onpointerleave={() => nav?.leave()}
>
  {@render children?.()}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-navmenu__trigger) {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      block-size: var(--ca-control-height);
      padding: 0 var(--ca-space-3);
      border: none;
      border-radius: var(--ca-radius-sm);
      background: transparent;
      color: var(--ca-text-primary);
      font: inherit;
      font-size: var(--ca-font-size-body2);
      font-weight: 500;
      cursor: pointer;
    }
    :global(.ca-navmenu__trigger:hover),
    :global(.ca-navmenu__trigger[data-state='open']) {
      background: var(--ca-action-hover);
    }
    :global(.ca-navmenu__chevron) {
      transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
    }
    :global(.ca-navmenu__trigger[data-state='open'] .ca-navmenu__chevron) {
      transform: rotate(180deg);
    }
    :global(.ca-navmenu-panel) {
      display: flex;
      flex-direction: column;
      min-inline-size: 14rem;
      padding: var(--ca-space-2);
      border-radius: var(--ca-radius-lg);
      outline: none;
      animation: ca-navmenu-in var(--ca-enter-fast) var(--ca-ease-decelerate);
    }
    :global(.ca-navmenu-panel[data-state='closed']) {
      animation: ca-navmenu-out var(--ca-enter-fast) var(--ca-ease-standard);
    }
    @keyframes ca-navmenu-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ca-navmenu-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-4px); }
    }
}
</style>

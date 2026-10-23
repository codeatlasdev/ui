<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../../primitives/index.js';
  import { MENUBAR_CONTEXT, type MenubarContext } from './menubar-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    class?: string;
    /** `MenubarMenu`s. */
    children?: Snippet;
    /** Called when the bar goes from no menu open to one open, and back (not for a switch between menus). */
    onOpenChange?: (open: boolean) => void;
  }

  let { class: className = '', children, onOpenChange, ...rest }: Props = $props();

  let openId = $state<string | null>(null);
  let bar = $state<HTMLElement | null>(null);

  const ITEM = '[data-ca-menubar-item]';

  function setOpen(id: string | null) {
    if (id === openId) return;
    const was = openId !== null;
    openId = id;
    if (was !== (id !== null)) onOpenChange?.(id !== null);
  }

  // One tab stop for the whole bar; arrows, Home and End move between the items.
  $effect(() => {
    if (bar) return rovingFocus(bar, { selector: ITEM, orientation: 'horizontal' });
  });

  setContext<MenubarContext>(MENUBAR_CONTEXT, {
    get openId() {
      return openId;
    },
    setOpen,
    move(from, dir, open) {
      if (!bar) return;
      const items = Array.from(bar.querySelectorAll<HTMLElement>(ITEM)).filter(
        (el) => !el.hasAttribute('data-disabled')
      );
      const i = items.findIndex((el) => el.dataset.caMenubarItem === from);
      if (i < 0) return;
      const target =
        dir === 'first' ? items[0]
        : dir === 'last' ? items[items.length - 1]
        : items[(i + dir + items.length) % items.length];
      if (!target) return;
      target.focus({ preventScroll: true });
      setOpen(open ? (target.dataset.caMenubarItem ?? null) : null);
    },
  });
</script>

<div
  {...rest}
  bind:this={bar}
  role="menubar"
  aria-orientation="horizontal"
  class="ca-menubar {className}"
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-menubar) {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      padding: var(--ca-space-1);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-1, transparent);
    }
}
</style>

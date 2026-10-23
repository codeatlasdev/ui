<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../../primitives/index.js';
  import { NAVMENU_CONTEXT, type NavMenuContext } from './navmenu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    class?: string;
    /** `NavigationMenuItem`s (a button with a panel) and `NavigationMenuLink`s (a plain link). */
    children?: Snippet;
    /** Milliseconds the pointer must rest on an item's button before its panel opens. Moving between items while one is open switches at once. */
    openDelay?: number;
    /** Milliseconds a panel stays open after the pointer leaves, so it can cross into it. */
    closeDelay?: number;
  }

  let { class: className = '', children, openDelay = 150, closeDelay = 250, ...rest }: Props = $props();

  let openId = $state<string | null>(null);
  let list = $state<HTMLElement | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function set(id: string | null) {
    clearTimeout(timer);
    openId = id;
  }

  // One tab stop for the top level; arrows, Home and End move between buttons and links without opening.
  $effect(() => {
    if (list) return rovingFocus(list, { selector: '[data-ca-navmenu-item]', orientation: 'horizontal' });
  });
  $effect(() => () => clearTimeout(timer));

  setContext<NavMenuContext>(NAVMENU_CONTEXT, {
    get openId() {
      return openId;
    },
    set,
    enter(id) {
      clearTimeout(timer);
      if (openId !== null || openDelay <= 0) openId = id;
      else timer = setTimeout(() => (openId = id), openDelay);
    },
    leave() {
      clearTimeout(timer);
      if (openId === null) return;
      if (closeDelay <= 0) openId = null;
      else timer = setTimeout(() => (openId = null), closeDelay);
    },
    keep: () => clearTimeout(timer),
  });
</script>

<nav {...rest} class="ca-navmenu {className}">
  <ul bind:this={list} class="ca-navmenu__list">
    {@render children?.()}
  </ul>
</nav>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-navmenu__list) {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ca-space-1);
      list-style: none;
      margin: 0;
      padding: 0;
    }
}
</style>

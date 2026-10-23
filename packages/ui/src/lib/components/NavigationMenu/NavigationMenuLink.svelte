<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { NAVMENU_CONTEXT, NAVMENU_PANEL_CONTEXT, type NavMenuContext } from './navmenu-context.js';

  interface Props extends Omit<HTMLAnchorAttributes, 'class' | 'children'> {
    class?: string;
    /** The link is the current page: sets `aria-current="page"`. */
    current?: boolean;
    /** A second line under the title, part of the link's accessible name. Panel links only. */
    description?: string;
    children?: Snippet;
  }

  let { class: className = '', current = false, description, children, onclick, ...rest }: Props = $props();

  const nav = getContext<NavMenuContext | undefined>(NAVMENU_CONTEXT);
  /** A link inside a panel (the panel is in the top layer, outside the list) is not a top-level roving item. */
  const inPanel = getContext<boolean | undefined>(NAVMENU_PANEL_CONTEXT) === true;
</script>

{#snippet anchor()}
  <a
    {...rest}
    class="ca-navmenu__link {className}"
    aria-current={current ? 'page' : undefined}
    data-ca-navmenu-item={inPanel ? undefined : ''}
    data-current={current ? '' : undefined}
    onclick={(e) => {
      onclick?.(e);
      nav?.set(null);
    }}
  >
    <span class="ca-navmenu__title">{@render children?.()}</span>
    {#if description}<span class="ca-navmenu__desc">{description}</span>{/if}
  </a>
{/snippet}

{#if inPanel}
  {@render anchor()}
{:else}
  <li class="ca-navmenu__entry">{@render anchor()}</li>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-navmenu__link) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-0-5, 2px);
      padding: var(--ca-space-2) var(--ca-space-3);
      border-radius: var(--ca-radius-sm);
      color: var(--ca-text-primary);
      text-decoration: none;
      font-size: var(--ca-font-size-body2);
    }
    :global(.ca-navmenu__link:hover) {
      background: var(--ca-action-hover);
    }
    :global(.ca-navmenu__link[data-current]) {
      color: var(--ca-brand-text);
      font-weight: 600;
    }
    :global(.ca-navmenu__title) {
      font-weight: 500;
    }
    :global(.ca-navmenu__desc) {
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-caption);
    }
}
</style>

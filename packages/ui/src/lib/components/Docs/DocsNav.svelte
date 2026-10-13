<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import MethodBadge from './MethodBadge.svelte';
  import type { DocsNavGroup } from './types.js';

  /**
   * DocsNav: sidebar tree: labelled groups of page links, current page marked with
   * aria-current. Used by DocsShell in the desktop rail and in the mobile Sheet.
   */
  interface Props {
    groups: DocsNavGroup[];
    pathname: string;
    label?: string;
    /** Called after a link is followed (closes the mobile Sheet). */
    onNavigate?: () => void;
  }

  let { groups, pathname, label, onNavigate }: Props = $props();
</script>

<nav class="ca-docs-nav" aria-label={label ?? t().docs.nav}>
  {#each groups as group, i (group.label ?? i)}
    {#if group.items.length}
      <div class="ca-docs-nav__group">
        {#if group.label}<p class="ca-docs-nav__label">{group.label}</p>{/if}
        <ul>
          {#each group.items as item (item.href)}
            <li>
              <a
                href={item.href}
                class="ca-docs-nav__link"
                aria-current={pathname === item.href ? 'page' : undefined}
                onclick={onNavigate}
              >
                <span class="ca-docs-nav__title">{item.title}</span>
                {#if item.badge}<MethodBadge method={item.badge} variant="plain" />{/if}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/each}
</nav>

<style>
  .ca-docs-nav {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .ca-docs-nav__label {
    margin: 0 0 0.375rem;
    padding: 0 0.625rem;
    font-size: var(--ca-font-size-caption);
    font-weight: 600;
    color: var(--ca-text-primary);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ca-docs-nav__link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 32px;
    padding: 0.375rem 0.625rem;
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    line-height: 1.4;
    color: var(--ca-text-secondary);
    text-decoration: none;
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-docs-nav__link:hover {
    color: var(--ca-text-primary);
    background: var(--ca-action-hover);
  }

  .ca-docs-nav__link:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
  }

  .ca-docs-nav__link[aria-current='page'] {
    color: var(--ca-brand-text);
    background: color-mix(in oklab, var(--ca-brand-main) 10%, transparent);
    font-weight: 500;
  }

  .ca-docs-nav__title {
    flex: 1;
    min-width: 0;
  }

  /* Touch: 44px rows (inside the Sheet, where the nav is the main control). */
  @media (pointer: coarse) {
    .ca-docs-nav__link { min-height: 44px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-docs-nav__link { transition: none; }
  }
</style>

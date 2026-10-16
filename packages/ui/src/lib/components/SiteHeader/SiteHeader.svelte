<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { PanelLeft } from '@lucide/svelte';
  import type { SidebarState } from '../AppShell/types.js';
  const t = useT();

  interface Props {
    trailing?: Snippet;
    class?:    string;
  }

  let { trailing, class: className = '' }: Props = $props();

  const shell = getContext<SidebarState>('appshell');

  // Breadcrumb: split pathname into segments, build crumbs
  let crumbs = $derived.by(() => {
    const parts = (shell?.pathname ?? '').replace(/\/$/, '').split('/').filter(Boolean);
    return parts.map((seg, i) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href:  '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }));
  });
</script>

<header class="ca-site-header {className}" data-ca-blur="mat-regular">
  <div class="ca-site-header__inner">
    <!-- Left: panel toggle + separator + breadcrumb -->
    <div class="ca-site-header__left">
      {#if shell}
        <button
          class="ca-site-header__toggle"
          aria-label={shell.panelOpen ? t().appShell.closeNavigation : t().appShell.openNavigation}
          title={shell.panelOpen ? t().appShell.closeNavigation : t().appShell.openNavigation}
          type="button"
          onclick={() => shell.togglePanel()}
        >
          <PanelLeft size={16} stroke-width={1.8} />
        </button>
        <span class="ca-site-header__sep" aria-hidden="true"></span>
      {/if}

      {#if crumbs.length > 0}
        <nav class="ca-site-header__breadcrumb" aria-label={t().breadcrumb.label}>
          <ol>
            {#each crumbs as crumb}
              <li>
                {#if !crumb.isLast}
                  <a href={crumb.href}>{crumb.label}</a>
                  <span class="ca-site-header__bc-sep" aria-hidden="true">/</span>
                {:else}
                  <span aria-current="page">{crumb.label}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </nav>
      {/if}
    </div>

    <!-- Right: consumer-provided trailing actions -->
    {#if trailing}
      <div class="ca-site-header__trailing">
        {@render trailing()}
      </div>
    {/if}
  </div>
</header>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-site-header {
      position: sticky;
      top: 0;
      z-index: var(--ca-z-sticky);
      flex-shrink: 0;
      width: 100%;
      background: var(--ca-glass-bg);
      /* hairline bottom separator — no border: property */
      box-shadow:
        inset 0 calc(var(--ca-border-width) * -1) 0 var(--ca-outline-subtle),
        var(--ca-shadow-sm);
    }

    .ca-site-header__inner {
      height: var(--ca-header-height);
      display: flex;
      align-items: center;
      gap: 0;
      padding: 0 var(--ca-space-4) 0 var(--ca-space-1);
    }

    .ca-site-header__left {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1);
      flex: 1;
      min-width: 0;
    }

    /* Panel toggle button */
    .ca-site-header__toggle {
      width: var(--ca-control-height);
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-control);
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ca-text-secondary);
      cursor: pointer;
      flex-shrink: 0;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-site-header__toggle:hover {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }
    .ca-site-header__toggle:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    /* Vertical separator */
    .ca-site-header__sep {
      display: block;
      width: var(--ca-border-width);
      height: var(--ca-space-4);
      background: var(--ca-outline-default);
      margin: 0 var(--ca-space-2);
      flex-shrink: 0;
    }

    /* Breadcrumb */
    .ca-site-header__breadcrumb ol {
      list-style: none;
      display: flex;
      align-items: center;
      gap: var(--ca-space-0-5);
    }
    .ca-site-header__breadcrumb li {
      display: flex;
      align-items: center;
      gap: var(--ca-space-0-5);
    }
    .ca-site-header__breadcrumb a,
    .ca-site-header__breadcrumb span[aria-current] {
      font-size: var(--ca-font-size-body2);
      line-height: 1;
      text-decoration: none;
      white-space: nowrap;
    }
    .ca-site-header__breadcrumb a {
      color: var(--ca-text-secondary);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-site-header__breadcrumb a:hover { color: var(--ca-text-primary); }
    .ca-site-header__breadcrumb span[aria-current] {
      color: var(--ca-text-primary);
      font-weight: var(--ca-font-weight-medium);
    }
    .ca-site-header__bc-sep {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
      margin: 0 var(--ca-space-0-5);
    }

    /* Right side */
    .ca-site-header__trailing {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1);
      margin-left: auto;
      flex-shrink: 0;
    }
}
</style>

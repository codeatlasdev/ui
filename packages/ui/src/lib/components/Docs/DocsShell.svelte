<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { docs } from '../../i18n/groups/docs.js';
  import type { Snippet } from 'svelte';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';
  import DocsHeader from './DocsHeader.svelte';
  import DocsNav from './DocsNav.svelte';
  import TableOfContents from './TableOfContents.svelte';
  import { restoreSidebar, saveSidebar, sidebarScript } from './sidebar-scroll.js';
  import type { DocsHeading, DocsNavGroup, DocsPagerLink, DocsSearchEntry, DocsSection } from './types.js';
  const t = useMessages(docs);

  /**
   * DocsShell: page frame for developer docs.
   *
   * Desktop (≥1200px): sticky opaque header (`DocsHeader`: brand, section tabs, search, theme) over a
   * 3-column grid: sidebar | content | "On this page" rail (≥1280px).
   * Below 1200px: ONE compact header (menu, brand, search, theme) with safe-area insets;
   * the menu opens a bottom Sheet holding the section switcher and the sidebar tree; the
   * page index becomes an inline disclosure above the content. Search opens full-height.
   *
   * ⌘K / Ctrl+K / "/" open search. Navigation is the consumer's: pass `onnavigate` (SvelteKit `goto`).
   *
   *   <DocsShell {sections} active="api" {groups} {pathname} {headings}
   *              searchIndex={() => fetch('/search.json').then((r) => r.json())}
   *              onnavigate={goto}>
   *     {#snippet brand()}<Logo /> Acme API <span>Docs</span>{/snippet}
   *     <article class="ca-prose">…</article>
   *   </DocsShell>
   *
   * With `groups` empty (e.g. the docs home) the sidebar and TOC collapse and content spans full width.
   */
  interface Props {
    sections: DocsSection[];
    /** `id` of the current section. */
    active?: string;
    /** Sidebar tree of the current section. */
    groups?: DocsNavGroup[];
    /** Current pathname, to mark the current page in the sidebar. */
    pathname: string;
    /** Headings of the current page for the "On this page" index. */
    headings?: DocsHeading[];
    searchIndex: DocsSearchEntry[] | (() => Promise<DocsSearchEntry[]>);
    onnavigate: (href: string) => void;
    /** Link target of the brand (default "/"). */
    brandHref?: string;
    brandLabel?: string;
    /** Brand mark + name inside the header link. */
    brand: Snippet;
    /** Extra header actions on the right (e.g. a GitHub link). Keep to 1–2 icon buttons. */
    actions?: Snippet;
    /** Content below the sidebar tree inside the mobile Sheet (e.g. external links). */
    menuFooter?: Snippet;
    /**
     * Previous/next pages. Cards at the end of the article on wide screens; a fixed bottom
     * action bar on narrow ones, so reading flows header → content → actions like an e-book.
     */
    pager?: { prev?: DocsPagerLink; next?: DocsPagerLink };
    children: Snippet;
  }

  let {
    sections,
    active,
    groups = [],
    pathname,
    headings = [],
    searchIndex,
    onnavigate,
    brandHref = '/',
    brandLabel,
    brand,
    actions,
    menuFooter,
    pager,
    children,
  }: Props = $props();

  const hasSidebar = $derived(groups.some((g) => g.items.length));
  const activeSection = $derived(sections.find((s) => s.id === active));

  // Sidebar position per section, kept across full page loads (static docs sites). The inline
  // script after the sidebar restores it before the first paint; this effect covers client-only
  // mounts (or a CSP without inline scripts) and keeps the current page in view on navigation.
  let sidebar = $state<HTMLElement>();
  const sidebarKey = $derived(`ca-docs-sidebar:${active ?? ''}`);
  const save = () => sidebar && saveSidebar(sidebar, sidebarKey);

  $effect(() => {
    void pathname;
    if (sidebar) restoreSidebar(sidebar, sidebarKey);
  });
</script>

<svelte:window onpagehide={save} />

<SkipLink class="ca-docs-skip">{t().docs.skipToContent}</SkipLink>

<DocsHeader {sections} {active} {groups} {pathname} {searchIndex} {onnavigate} {brandHref} {brandLabel} {brand} {actions} {menuFooter} />

<div class="ca-docs" class:ca-docs--bare={!hasSidebar}>
  {#if hasSidebar}
    <aside
      class="ca-docs-sidebar"
      aria-label={t().docs.sectionNavigation}
      bind:this={sidebar}
      onclickcapture={save}
    >
      <DocsNav {groups} {pathname} label={activeSection?.label ?? t().docs.nav} />
    </aside>
    {@html sidebarScript(sidebarKey)}
  {/if}

  <main class="ca-docs-main" id="main" tabindex="-1">
    {#if headings.length > 1}
      <TableOfContents {headings} variant="inline" class="ca-docs-toc-inline" />
    {/if}
    {@render children()}
    {#if pager?.prev || pager?.next}
      <nav class="ca-docs-pager" data-ca-blur="chrome-layer" data-ca-blur-wide-off aria-label={t().docs.pager}>
        {#if pager.prev}
          <a class="ca-docs-pager__link" href={pager.prev.href} rel="prev">
            <ChevronLeft size={18} aria-hidden="true" />
            <span class="ca-docs-pager__text">
              <small>{t().docs.previous}</small>
              <span class="ca-docs-pager__title">{pager.prev.title}</span>
            </span>
          </a>
        {/if}
        {#if pager.next}
          <a class="ca-docs-pager__link ca-docs-pager__link--next" href={pager.next.href} rel="next">
            <span class="ca-docs-pager__text">
              <small>{t().docs.next}</small>
              <span class="ca-docs-pager__title">{pager.next.title}</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        {/if}
      </nav>
    {/if}
  </main>

  {#if hasSidebar && headings.length > 1}
    <aside class="ca-docs-toc" aria-label={t().docs.toc}>
      <TableOfContents {headings} />
    </aside>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :root {
      --ca-docs-sidebar-w: 272px;
      --ca-docs-toc-w: 232px;
    }

    /* ── Pager ─────────────────────────────────────────────────────────── */
    .ca-docs-pager {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ca-space-3);
      margin-top: var(--ca-space-12);
      padding-top: var(--ca-space-6);
      border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
    }
    .ca-docs-pager__link {
      display: flex;
      align-items: center;
      gap: var(--ca-space-3);
      min-width: 0;
      padding: var(--ca-space-3) var(--ca-space-4);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      color: var(--ca-text-primary);
      text-decoration: none;
      transition: border-color var(--ca-duration-fast) var(--ca-ease-standard), background var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-docs-pager__link--next { grid-column: 2; justify-content: flex-end; text-align: right; }
    .ca-docs-pager__link:hover { border-color: var(--ca-outline-default); background: var(--ca-action-hover); }
    .ca-docs-pager__link:focus-visible { outline: var(--ca-border-width-focus) solid var(--ca-focus-ring); outline-offset: var(--ca-focus-ring-offset); }
    .ca-docs-pager__text { display: grid; gap: var(--ca-space-0-5); min-width: 0; }
    .ca-docs-pager small { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
    .ca-docs-pager__title { font-weight: var(--ca-font-weight-semibold); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ca-docs-pager :global(svg) { flex-shrink: 0; color: var(--ca-text-secondary); }

    /* ── Layout ─────────────────────────────────────────────────────────── */

    .ca-docs {
      display: grid;
      grid-template-columns: var(--ca-docs-sidebar-w) minmax(0, 1fr) var(--ca-docs-toc-w);
      max-width: var(--ca-docs-max-w);
      margin: 0 auto;
    }

    .ca-docs--bare { display: block; }

    .ca-docs-sidebar {
      position: sticky;
      top: calc(var(--ca-docs-header-h) + var(--ca-safe-top));
      align-self: start;
      height: calc(var(--ca-vh) - var(--ca-docs-header-h) - var(--ca-safe-top));
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: var(--ca-space-6) var(--ca-space-3) var(--ca-space-12);
      border-right: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-docs-main {
      min-width: 0;
      outline: none;
      /* Fluid gutter keeps content off the sidebar, the TOC and the screen edge (plus notches). */
      padding:
        var(--ca-space-8)
        max(var(--ca-gutter), var(--ca-safe-right))
        var(--ca-space-16)
        max(var(--ca-gutter), var(--ca-safe-left));
    }

    .ca-docs-toc {
      position: sticky;
      top: calc(var(--ca-docs-header-h) + var(--ca-safe-top));
      align-self: start;
      max-height: calc(var(--ca-vh) - var(--ca-docs-header-h) - var(--ca-safe-top));
      overflow-y: auto;
      padding-right: max(var(--ca-space-6), var(--ca-safe-right));
      padding-left: var(--ca-space-2);
    }

    :global(.ca-docs-toc-inline) { display: none; }

    /* ── Responsive ─────────────────────────────────────────────────────── */

    @media (max-width: 1199.98px) {
      .ca-docs { display: block; }
      .ca-docs-toc { display: none; }
      :global(.ca-docs-toc-inline) { display: block; }
      .ca-docs-sidebar { display: none; }
    }

    /* Narrow screens: the pager becomes the page's action bar, pinned above the home indicator. */
    @media (max-width: 899.98px) {
      .ca-docs-main:has(.ca-docs-pager) {
        padding-bottom: calc(var(--ca-space-12) + var(--ca-touch-target) + var(--ca-safe-bottom));
      }
      /* One bar, two halves: like a native toolbar, not two cards floating in a strip. */
      .ca-docs-pager {
        position: fixed;
        inset: auto 0 0 0;
        z-index: var(--ca-z-sticky);
        margin: 0;
        gap: 0;
        padding: 0 var(--ca-safe-right) var(--ca-safe-bottom) var(--ca-safe-left);
        border-top: none;
        background: var(--ca-chrome-bg);
        box-shadow: inset 0 var(--ca-border-width) 0 var(--ca-glass-separator);
      }
      .ca-docs-pager__link {
        min-height: calc(var(--ca-touch-target) + var(--ca-space-2));
        padding: var(--ca-space-1-5) var(--ca-space-4);
        gap: var(--ca-space-2);
        border: none;
        border-radius: 0;
        background: transparent;
      }
      .ca-docs-pager__link:hover { background: var(--ca-action-hover); }
      .ca-docs-pager__link:active { background: var(--ca-action-selected); }
      /* Hairline between the halves (only when both exist). */
      .ca-docs-pager__link + .ca-docs-pager__link {
        box-shadow: inset var(--ca-border-width) 0 0 var(--ca-glass-separator);
      }
      .ca-docs-pager__link:focus-visible { outline-offset: calc(var(--ca-border-width-focus) * -1); }
      .ca-docs-pager small {
        font-size: var(--ca-font-size-micro);
        letter-spacing: var(--ca-overline-tracking);
        text-transform: uppercase;
      }
      .ca-docs-pager__title { font-size: var(--ca-font-size-body2); }
    }

}
</style>

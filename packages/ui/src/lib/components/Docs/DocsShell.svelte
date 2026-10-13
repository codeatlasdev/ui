<script lang="ts">
  import { primeKeyboard } from '../../actions/autofocus.js';
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { Menu, Search } from '@lucide/svelte';
  import Kbd from '../Kbd/Kbd.svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';
  import Sheet from '../Sheet/Sheet.svelte';
  import ThemeToggle from '../ThemeToggle/ThemeToggle.svelte';
  import DocsNav from './DocsNav.svelte';
  import DocsSearch from './DocsSearch.svelte';
  import TableOfContents from './TableOfContents.svelte';
  import type { DocsHeading, DocsNavGroup, DocsSearchEntry, DocsSection } from './types.js';

  /**
   * DocsShell: page frame for developer docs.
   *
   * Desktop (≥1024px): sticky glass header (brand, section tabs, search, theme) over a
   * 3-column grid: sidebar | content | "On this page" rail (≥1280px).
   * Below 1024px: ONE compact header (menu, brand, search, theme) with safe-area insets;
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
    children,
  }: Props = $props();

  let searchOpen = $state(false);
  let menuOpen = $state(false);
  // "⌘K" on Apple platforms, "Ctrl K" elsewhere; resolved after mount so SSR and hydration agree.
  let shortcut = $state('Ctrl K');

  onMount(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) shortcut = '⌘K';
  });

  const hasSidebar = $derived(groups.some((g) => g.items.length));
  const activeSection = $derived(sections.find((s) => s.id === active));

  function onkeydown(e: KeyboardEvent) {
    const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]');
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      searchOpen = true;
    }
  }
</script>

<svelte:window {onkeydown} />

<SkipLink class="ca-docs-skip">{t().docs.skipToContent}</SkipLink>

<header class="ca-docs-header">
  <div class="ca-docs-header__inner">
    <button type="button" class="ca-docs-icon ca-docs-menu" aria-label={t().docs.openNavigation} onclick={() => (menuOpen = true)}>
      <Menu size={20} />
    </button>

    <a href={brandHref} class="ca-docs-brand" aria-label={brandLabel}>{@render brand()}</a>

    <nav class="ca-docs-sections" aria-label={t().docs.sections}>
      {#each sections as s (s.id)}
        <a href={s.href} class="ca-docs-section" aria-current={s.id === active ? 'page' : undefined}>{s.label}</a>
      {/each}
    </nav>

    <div class="ca-docs-spacer"></div>

    <button type="button" class="ca-docs-search-btn" onclick={() => { primeKeyboard(); searchOpen = true; }}>
      <Search size={16} aria-hidden="true" />
      <span class="ca-docs-search-btn__label">{t().docs.search.label}</span>
      <Kbd>{shortcut}</Kbd>
    </button>
    <button type="button" class="ca-docs-icon ca-docs-search-icon" aria-label={t().docs.search.short} onclick={() => { primeKeyboard(); searchOpen = true; }}>
      <Search size={20} />
    </button>

    {@render actions?.()}
    <ThemeToggle label={t().docs.toggleTheme} class="ca-docs-theme" />
  </div>
</header>

<div class="ca-docs" class:ca-docs--bare={!hasSidebar}>
  {#if hasSidebar}
    <aside class="ca-docs-sidebar" aria-label={t().docs.sectionNavigation}>
      <DocsNav {groups} {pathname} label={activeSection?.label ?? t().docs.nav} />
    </aside>
  {/if}

  <main class="ca-docs-main" id="main" tabindex="-1">
    {#if headings.length > 1}
      <TableOfContents {headings} variant="inline" class="ca-docs-toc-inline" />
    {/if}
    {@render children()}
  </main>

  {#if hasSidebar && headings.length > 1}
    <aside class="ca-docs-toc" aria-label={t().docs.toc}>
      <TableOfContents {headings} />
    </aside>
  {/if}
</div>

<Sheet bind:open={menuOpen} title={t().docs.navigation}>
  {#if sections.length > 1}
    <nav class="ca-docs-sheet-sections" aria-label={t().docs.sections}>
      {#each sections as s (s.id)}
        <a
          href={s.href}
          aria-current={s.id === active ? 'page' : undefined}
          onclick={() => (menuOpen = false)}
        >
          {s.label}
        </a>
      {/each}
    </nav>
  {/if}
  {#if hasSidebar}
    <DocsNav {groups} {pathname} label={activeSection?.label ?? t().docs.nav} onNavigate={() => (menuOpen = false)} />
  {/if}
  {@render menuFooter?.()}
</Sheet>

<DocsSearch bind:open={searchOpen} index={searchIndex} onselect={onnavigate} />

<style>
  :root {
    --ca-docs-header-h: 56px;
    --ca-docs-sidebar-w: 272px;
    --ca-docs-toc-w: 232px;
    --ca-docs-max-w: 1440px;
  }

  :global(html) {
    scroll-padding-top: calc(var(--ca-docs-header-h) + var(--ca-safe-top) + 1.5rem);
  }

  /* ── Header ─────────────────────────────────────────────────────────── */

  .ca-docs-header {
    position: sticky;
    top: 0;
    z-index: var(--ca-z-sticky);
    padding-top: var(--ca-safe-top);
    background: color-mix(in oklab, var(--ca-surface-base) 82%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid var(--ca-outline-subtle);
  }

  .ca-docs-header__inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: var(--ca-docs-header-h);
    max-width: var(--ca-docs-max-w);
    margin: 0 auto;
    padding: 0 max(1.25rem, var(--ca-safe-right)) 0 max(1.25rem, var(--ca-safe-left));
  }

  .ca-docs-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    margin-right: 1rem;
    color: var(--ca-text-primary);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-decoration: none;
    white-space: nowrap;
  }

  .ca-docs-brand:focus-visible,
  .ca-docs-section:focus-visible,
  .ca-docs-icon:focus-visible,
  .ca-docs-search-btn:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: 2px;
    border-radius: var(--ca-radius-md);
  }

  .ca-docs-sections {
    display: flex;
    gap: 0.25rem;
    height: 100%;
  }

  .ca-docs-section {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-docs-section:hover { color: var(--ca-text-primary); }

  .ca-docs-section[aria-current='page'] {
    color: var(--ca-text-primary);
    border-bottom-color: var(--ca-brand-main);
  }

  .ca-docs-spacer { flex: 1; }

  .ca-docs-search-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 18rem;
    height: 2.25rem;
    white-space: nowrap;
    padding: 0 0.5rem 0 0.75rem;
    border: 1px solid var(--ca-outline-default);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
    color: var(--ca-text-secondary);
    font: inherit;
    font-size: var(--ca-font-size-body2);
    cursor: pointer;
    transition: border-color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-docs-search-btn:hover { border-color: var(--ca-outline-strong); }
  .ca-docs-search-btn__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: left; }
  .ca-docs-search-btn :global(.ca-kbd) { flex-shrink: 0; margin-left: 0.25rem; }

  .ca-docs-icon {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: var(--ca-radius-md);
    background: transparent;
    color: var(--ca-text-secondary);
    cursor: pointer;
  }

  .ca-docs-icon:hover { color: var(--ca-text-primary); background: var(--ca-action-hover); }

  :global(.ca-docs-theme.ca-rail-btn) {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
  }

  /* Right cluster (search, consumer actions, theme) is pinned by the spacer; actions never stretch. */
  .ca-docs-header__inner > :global(:not(.ca-docs-spacer)) { flex-shrink: 0; }
  .ca-docs-header__inner > .ca-docs-sections { flex-shrink: 1; min-width: 0; }

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
    padding: 1.5rem 0.75rem 3rem;
    border-right: 1px solid var(--ca-outline-subtle);
  }

  .ca-docs-main {
    min-width: 0;
    outline: none;
  }

  .ca-docs-toc {
    position: sticky;
    top: calc(var(--ca-docs-header-h) + var(--ca-safe-top));
    align-self: start;
    max-height: calc(var(--ca-vh) - var(--ca-docs-header-h) - var(--ca-safe-top));
    overflow-y: auto;
    padding-right: max(1.5rem, var(--ca-safe-right));
    padding-left: 0.5rem;
  }

  :global(.ca-docs-toc-inline) { display: none; }

  /* ── Sheet section switcher ─────────────────────────────────────────── */

  .ca-docs-sheet-sections {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--ca-outline-subtle);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ca-docs-sheet-sections a {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    min-height: 44px;
    padding: 0 1rem;
    border: 1px solid var(--ca-outline-default);
    border-radius: var(--ca-radius-pill);
    color: var(--ca-text-primary);
    font-size: var(--ca-font-size-body2);
    font-weight: 500;
    text-decoration: none;
  }

  .ca-docs-sheet-sections a[aria-current='page'] {
    border-color: transparent;
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }

  /* ── Responsive ─────────────────────────────────────────────────────── */

  @media (max-width: 1279px) {
    .ca-docs { grid-template-columns: var(--ca-docs-sidebar-w) minmax(0, 1fr); }
    .ca-docs-toc { display: none; }
    :global(.ca-docs-toc-inline) { display: block; }
  }

  @media (max-width: 1023px) {
    .ca-docs { display: block; }
    .ca-docs-sidebar,
    .ca-docs-sections,
    .ca-docs-search-btn { display: none; }
    .ca-docs-icon { display: flex; }
    :global(:root) { --ca-docs-header-h: 52px; }
    .ca-docs-header__inner {
      gap: 0.25rem;
      padding: 0 max(0.5rem, var(--ca-safe-right)) 0 max(0.5rem, var(--ca-safe-left));
    }
    .ca-docs-brand { margin-right: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-docs-section,
    .ca-docs-search-btn { transition: none; }
  }
</style>

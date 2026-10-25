<script lang="ts">
  import { primeKeyboard } from '../../actions/autofocus.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { docs } from '../../i18n/groups/docs.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { Menu, Search } from '@lucide/svelte';
  import Kbd from '../Kbd/Kbd.svelte';
  import Sheet from '../Sheet/Sheet.svelte';
  import ThemeToggle from '../ThemeToggle/ThemeToggle.svelte';
  import DocsNav from './DocsNav.svelte';
  import DocsSearch from './DocsSearch.svelte';
  import type { DocsNavGroup, DocsSearchEntry, DocsSection } from './types.js';
  const t = useMessages(docs);

  /**
   * DocsHeader: the sticky top bar of a docs-style site, on its own.
   *
   * `DocsShell` renders it above its sidebar grid; render it directly on pages that are not a docs
   * frame (a landing page, a template gallery) so every page of a site shares one header: the same
   * height, container width, brand position, section tabs with an underline for the current one,
   * search (⌘K / Ctrl+K / "/"), theme toggle and phone menu. The bar is opaque: content never shows
   * through it.
   *
   *   <DocsHeader {sections} active="gallery" {pathname} {searchIndex} onnavigate={goto}>
   *     {#snippet brand()}<Logo /> Acme{/snippet}
   *   </DocsHeader>
   *
   * It renders no `<main>` and no skip link: the page keeps its own `<main id="main">` (and its
   * `SkipLink`, or `DocsShell`'s).
   */
  interface Props {
    sections: DocsSection[];
    /** `id` of the current section. */
    active?: string;
    /** Sidebar tree of the current section, shown in the phone menu. */
    groups?: DocsNavGroup[];
    /** Current pathname, to mark the current page in the phone menu tree. */
    pathname: string;
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
  }

  let {
    sections,
    active,
    groups = [],
    pathname,
    searchIndex,
    onnavigate,
    brandHref = '/',
    brandLabel,
    brand,
    actions,
    menuFooter,
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

    {#if actions}<div class="ca-docs-actions">{@render actions()}</div>{/if}
    <ThemeToggle label={t().docs.toggleTheme} class="ca-docs-theme" />
  </div>
</header>

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
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :root {
      --ca-docs-header-h: 56px;
      --ca-docs-max-w: 1440px;
    }

    :global(html) {
      scroll-padding-top: calc(var(--ca-docs-header-h) + var(--ca-safe-top) + var(--ca-space-6));
    }

    /* ── Header ─────────────────────────────────────────────────────────── */

    .ca-docs-header {
      position: sticky;
      top: 0;
      z-index: var(--ca-z-sticky);
      padding-top: var(--ca-safe-top);
      /* Opaque on purpose: content never shows through the bar, and browsers tint the status bar from it. */
      background-color: var(--ca-surface-base);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-docs-header__inner {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      height: var(--ca-docs-header-h);
      max-width: var(--ca-docs-max-w);
      margin: 0 auto;
      padding: 0 max(var(--ca-space-5), var(--ca-safe-right)) 0 max(var(--ca-space-5), var(--ca-safe-left));
    }

    .ca-docs-brand {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      min-height: var(--ca-touch-target);
      margin-right: var(--ca-space-4);
      color: var(--ca-text-primary);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      text-decoration: none;
      white-space: nowrap;
    }

    .ca-docs-brand:focus-visible,
    .ca-docs-section:focus-visible,
    .ca-docs-icon:focus-visible,
    .ca-docs-search-btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
      border-radius: var(--ca-radius-md);
    }

    .ca-docs-sections {
      display: flex;
      gap: var(--ca-space-1);
      height: 100%;
    }

    .ca-docs-section {
      display: flex;
      align-items: center;
      padding: 0 var(--ca-space-3);
      border-bottom: var(--ca-border-width-strong) solid transparent;
      margin-bottom: calc(var(--ca-border-width) * -1);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
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
      gap: var(--ca-space-2);
      width: 18rem;
      height: var(--ca-control-height);
      white-space: nowrap;
      padding: 0 var(--ca-space-2) 0 var(--ca-space-3);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-control);
      background: var(--ca-surface-raised);
      color: var(--ca-text-secondary);
      font: inherit;
      font-size: var(--ca-font-size-body2);
      cursor: pointer;
      transition: border-color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-docs-search-btn:hover { border-color: var(--ca-outline-strong); }
    .ca-docs-search-btn__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: left; }
    .ca-docs-search-btn :global(.ca-kbd) { flex-shrink: 0; margin-left: var(--ca-space-1); }

    .ca-docs-icon {
      display: none;
      align-items: center;
      justify-content: center;
      width: var(--ca-touch-target);
      height: var(--ca-touch-target);
      border: none;
      border-radius: var(--ca-radius-control);
      background: transparent;
      color: var(--ca-text-secondary);
      cursor: pointer;
    }

    .ca-docs-icon:hover { color: var(--ca-text-primary); background: var(--ca-action-hover); }

    /* Consumer actions (links or buttons) get the same 44px box, color and focus as built-in icons,
       so a plain <a><Icon/></a> can never sit off-axis or show the UA link/visited color. */
    .ca-docs-actions { display: flex; align-items: center; }
    .ca-docs-actions > :global(a),
    .ca-docs-actions > :global(button) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-touch-target);
      height: var(--ca-touch-target);
      border: none;
      border-radius: var(--ca-radius-control);
      background: transparent;
      color: var(--ca-text-secondary);
      cursor: pointer;
    }
    .ca-docs-actions > :global(a:hover),
    .ca-docs-actions > :global(button:hover) { color: var(--ca-text-primary); background: var(--ca-action-hover); }
    .ca-docs-actions > :global(a:focus-visible),
    .ca-docs-actions > :global(button:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    :global(.ca-docs-theme.ca-rail-btn) {
      flex: 0 0 auto;
      width: var(--ca-touch-target);
      height: var(--ca-touch-target);
    }

    /* Right cluster (search, consumer actions, theme) is pinned by the spacer; actions never stretch. */
    .ca-docs-header__inner > :global(:not(.ca-docs-spacer)) { flex-shrink: 0; }
    .ca-docs-header__inner > .ca-docs-sections { flex-shrink: 1; min-width: 0; }

    /* ── Sheet section switcher ─────────────────────────────────────────── */

    .ca-docs-sheet-sections {
      display: flex;
      gap: var(--ca-space-2);
      margin-bottom: var(--ca-space-4);
      padding-bottom: var(--ca-space-4);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .ca-docs-sheet-sections a {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      min-height: var(--ca-touch-target);
      padding: 0 var(--ca-space-4);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      text-decoration: none;
    }

    .ca-docs-sheet-sections a[aria-current='page'] {
      border-color: transparent;
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }

    @media (max-width: 1199.98px) {
      :global(:root) { --ca-docs-header-h: 52px; }
      .ca-docs-sections,
      .ca-docs-search-btn { display: none; }
      .ca-docs-icon { display: flex; }
      .ca-docs-header__inner {
        gap: var(--ca-space-1);
        padding: 0 max(var(--ca-space-2), var(--ca-safe-right)) 0 max(var(--ca-space-2), var(--ca-safe-left));
      }
      .ca-docs-brand { margin-right: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-docs-section,
      .ca-docs-search-btn { transition: none; }
    }
}
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { Spring } from 'svelte/motion';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import type { NavModule } from './types.js';
  import { firstModulePath, isNavSection, matchModuleIndex, RAIL_WIDTH, PANEL_WIDTH } from './types.js';
  import { readShellState, shellScript, writeShellState } from './shell-state.js';
  import Rail from './Rail.svelte';
  import Panel from './Panel.svelte';
  import MobileHeader from './MobileHeader.svelte';
  import BottomNav from './BottomNav.svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';

  interface Props {
    modules:        NavModule[];
    pathname:       string;
    onNavigate?:    (path: string) => void;
    defaultModule?: number;
    /**
     * Keeps the shell across page loads: panel open/closed, selected module, expanded sections
     * (localStorage) and the panel scroll (sessionStorage), restored before first paint. Turn it
     * off for demos and embeds that must always start from the defaults.
     */
    persistPanel?:  boolean;
    header?:        Snippet;
    /** Brand mark (logo) shown at the top of the Rail and in the mobile header. */
    brand?:         Snippet;
    /** Items pinned to the bottom of the Rail (avatar, notifications…) */
    railBottom?:    Snippet;
    /**
     * Compact controls rendered at the trailing edge of the single mobile header
     * (session/workspace switcher, account menu…). Below 900px the desktop `header`
     * snippet is hidden, so put anything that must stay reachable here.
     */
    mobileHeaderActions?: Snippet;
    /**
     * Replaces the plain page-title text in the mobile header, e.g. a tappable session
     * title that opens a Sheet. It fills the space between the brand and `mobileHeaderActions`.
     */
    mobileTitle?: Snippet;
    /**
     * `id` given to the content region, the target of the skip link. By default the region is the
     * page's `<main id tabindex="-1">` landmark. Pass `null` when your own
     * `<main id="main" tabindex="-1">` is the target: the region then renders as a plain `div`
     * so the page never gets two landmarks.
     */
    mainId?:        string | null;
    /**
     * Render the "Skip to content" link. Turn it off when the shell is embedded in a page
     * that already has one (a framed demo, a preview), so the page does not get two.
     */
    skipLink?:      boolean;
    children?:      Snippet;
  }

  let {
    modules,
    pathname,
    onNavigate,
    defaultModule = 0,
    persistPanel  = true,
    header,
    brand,
    railBottom,
    mobileHeaderActions,
    mobileTitle,
    mainId = 'main',
    skipLink = true,
    children,
  }: Props = $props();

  // `persistPanel` reads on the client only. The server renders the defaults and `shellScript`
  // sets `data-ca-panel` / `data-ca-module` on <html> before paint, so the stored layout shows
  // without waiting for hydration.
  // svelte-ignore state_referenced_locally
  const stored = persistPanel ? readShellState() : null;

  // Lets Panel and SectionGroup know they should keep their scroll / open state.
  setContext('appshell-persist', {
    get enabled() { return persistPanel; },
  });

  // The URL decides the module when it matches one; otherwise the last stored module, then `defaultModule`.
  function resolveModule(path: string): number {
    const hit = matchModuleIndex(modules, path);
    if (hit >= 0) return hit;
    const saved = modules.findIndex((m) => m.id === stored?.module);
    return saved >= 0 ? saved : Math.min(Math.max(0, defaultModule), modules.length - 1);
  }

  let panelOpen = $state(stored?.panel ?? true);
  // svelte-ignore state_referenced_locally
  let selectedIndex = $state(resolveModule(pathname));

  let activeModuleIndex = $derived(resolveModule(pathname));
  $effect(() => { selectedIndex = activeModuleIndex; });

  // Current page title for MobileHeader: active item label, fallback to module label
  let pageTitle = $derived.by(() => {
    const mod = modules[activeModuleIndex];
    if (!mod) return '';
    for (const entry of mod.items) {
      if (isNavSection(entry)) {
        const hit = entry.items.find(i => pathname === i.path || pathname.startsWith(i.path + '/'));
        if (hit) return hit.label;
      } else if (pathname === entry.path || pathname.startsWith(entry.path + '/')) {
        return entry.label;
      }
    }
    return mod.label;
  });

  function setPanelOpen(v: boolean) {
    panelOpen = v;
    if (persistPanel) writeShellState({ panel: v });
  }

  // A panel listing a single destination only repeats the rail icon and the
  // page title, so it is skipped for modules with fewer than two leaves.
  let selectedHasChoices = $derived.by(() => {
    const mod = modules[selectedIndex];
    if (!mod) return false;
    let leaves = 0;
    for (const entry of mod.items) leaves += isNavSection(entry) ? entry.items.length : 1;
    return leaves > 1;
  });
  let panelVisible = $derived(panelOpen && selectedHasChoices);

  // One spring drives the panel width and the main margin so they stay in lock-step.
  // precision 0.5px: a layout pixel is the smallest visible step, and the Spring snaps to
  // the exact target once within it, so the offset settles on an integer (252, not 251.984).
  // It starts AT the target (no open animation on load): a reload must not replay the slide.
  // svelte-ignore state_referenced_locally
  const panelW = new Spring(panelVisible ? PANEL_WIDTH : 0, { stiffness: 0.22, damping: 0.88, precision: 0.5 });
  $effect(() => {
    // Reduced motion: jump straight to the target, no frames in between.
    panelW.set(panelVisible ? PANEL_WIDTH : 0, { instant: reducedMotion.value });
  });

  // Keep <html data-ca-*> in step with the live state so CSS and the next page load agree.
  $effect(() => {
    if (!persistPanel) return;
    const root = document.documentElement;
    root.setAttribute('data-ca-panel', panelOpen ? 'open' : 'closed');
    const id = modules[selectedIndex]?.id;
    if (id) root.setAttribute('data-ca-module', id);
    root.setAttribute('data-ca-hydrated', '');
  });
  $effect(() => () => document.documentElement.removeAttribute('data-ca-hydrated'));

  // Persist the selected module whenever the URL moves it (a link, back/forward), not only Rail clicks.
  $effect(() => {
    const id = modules[selectedIndex]?.id;
    if (persistPanel && id) writeShellState({ module: id });
  });

  setContext('appshell', {
    get panelOpen()  { return panelVisible; },
    get pathname()   { return pathname; },
    setPanelOpen,
    togglePanel: () => setPanelOpen(!panelOpen),
    navigate: (path: string) => onNavigate?.(path),
  });
</script>

<!--
  Sidebar is fixed-position; main content shifts right via margin-left.
  Panel spring drives both the panel width and the main margin so they
  stay in sync without layout shifts.
-->
{#if skipLink}
  <SkipLink href="#{mainId ?? 'main'}" />
{/if}
<div class="ca-shell">
  <!-- Desktop only sidebar -->
  <div class="ca-sidebar">
    <Rail
      {modules}
      activeIndex={selectedIndex}
      {brand}
      bottom={railBottom}
      onSelect={(i) => {
        if (i !== selectedIndex) {
          selectedIndex = i;
          if (persistPanel) writeShellState({ module: modules[i].id });
          onNavigate?.(firstModulePath(modules[i]));
        }
        if (!panelOpen) setPanelOpen(true);
      }}
    />
    <Panel
      {modules}
      {pathname}
      activeModuleIndex={selectedIndex}
      show={panelVisible}
      panelW={panelW.current}
    />
  </div>
  {#if persistPanel}{@html shellScript(modules.map((m) => m.id))}{/if}

  <!-- Main area -->
  <div
    class="ca-main"
    style="--ca-main-ml: calc({RAIL_WIDTH}px + {panelW.current}px)"
  >
    <!-- Desktop header, only rendered when header snippet is provided -->
    {#if header}
      <div class="ca-shell__desktop-header">
        {@render header()}
      </div>
    {/if}
    <!-- Mobile header -->
    <div class="ca-shell__mobile-header">
      <MobileHeader leading={brand} title={pageTitle} titleSlot={mobileTitle} trailing={mobileHeaderActions} />
    </div>
    <!-- Page content. Default: the <main> landmark and skip target (focus is programmatic only).
         mainId={null}: a plain div, the page owns <main>. -->
    {#if mainId}
      <main class="ca-shell__content" id={mainId} tabindex="-1">
        {@render children?.()}
      </main>
    {:else}
      <div class="ca-shell__content">
        {@render children?.()}
      </div>
    {/if}
  </div>

  <!-- Mobile bottom nav -->
  <BottomNav
    {modules}
    activeIndex={selectedIndex}
    onSelect={(i) => {
      selectedIndex = i;
      onNavigate?.(firstModulePath(modules[i]));
    }}
  />
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-shell {
      display: block;
      height: var(--ca-vh);
      overflow: hidden;
      background: transparent;
    }

    .ca-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: var(--ca-z-nav);
      display: flex;
      flex-direction: row;
    }

    .ca-main {
      height: var(--ca-vh);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-left: var(--ca-main-ml, 0);
    }

    /*
     * Before hydration the server markup is the default (panel open). `shellScript` sets
     * data-ca-panel on <html> from the stored state, so a stored-closed panel is laid out closed
     * from the first paint. `data-ca-hydrated` (set once the shell is live) hands control back
     * to the spring.
     */
    :global(html[data-ca-panel='closed']:not([data-ca-hydrated])) .ca-main {
      margin-left: var(--ca-rail-width) !important;
    }
    :global(html[data-ca-panel='closed']:not([data-ca-hydrated])) :global(.ca-panel) {
      display: none;
    }

    .ca-shell__desktop-header {
      display: block;
    }

    .ca-shell__mobile-header {
      display: none !important;
    }

    .ca-shell__content {
      flex: 1;
      min-height: 0;
      /* AppList/AppForm use flex:1 here: overflow:hidden to contain their scroll */
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    @media (max-width: 899.98px) {
      .ca-sidebar {
        display: none;
      }

      .ca-main {
        margin-left: 0 !important;
        /* Bottom nav is fixed: reserve its height plus the home-indicator inset. */
        padding-bottom: calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom));
      }

      .ca-shell__desktop-header {
        display: none !important;
      }

      .ca-shell__mobile-header {
        display: flex !important;
      }
    }
}
</style>

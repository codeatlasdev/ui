<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { spring } from 'svelte/motion';
  import type { NavModule } from './types.js';
  import { findActiveModuleIndex, findActiveItemPath, firstModulePath, isNavSection, RAIL_WIDTH, PANEL_WIDTH } from './types.js';
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
     * `id` given to the content region, the target of the skip link. The region is a plain
     * `div` (not a landmark) so a `<main>` you render inside never nests another one.
     * Pass `null` when your own `<main id="main" tabindex="-1">` is the target.
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

  const STORAGE_KEY = 'ca-panel-open';

  function readStorage(): boolean {
    if (!persistPanel) return true;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === null ? true : v === 'true';
    } catch { return true; }
  }

  let panelOpen    = $state(readStorage());
  let selectedIndex = $state(0);

  let activeModuleIndex = $derived(findActiveModuleIndex(modules, pathname));
  $effect(() => { selectedIndex = activeModuleIndex; });

  // Current page title for MobileHeader — active item label, fallback to module label
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
    if (persistPanel) {
      try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
    }
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

  // Spring for smooth panel slide — mirrors the width the panel animates to
  const panelW = spring(0, { stiffness: 0.22, damping: 0.88 });
  $effect(() => { panelW.set(panelVisible ? PANEL_WIDTH : 0); });

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
      panelW={$panelW}
    />
  </div>

  <!-- Main area -->
  <div
    class="ca-main"
    style="--ca-main-ml: calc({RAIL_WIDTH}px + {$panelW}px)"
  >
    <!-- Desktop header — only rendered when header snippet is provided -->
    {#if header}
      <div class="ca-shell__desktop-header">
        {@render header()}
      </div>
    {/if}
    <!-- Mobile header -->
    <div class="ca-shell__mobile-header">
      <MobileHeader leading={brand} title={pageTitle} titleSlot={mobileTitle} trailing={mobileHeaderActions} />
    </div>
    <!-- Page content. A tabindex=-1 div (not a landmark) is the skip target: focus is programmatic only. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="ca-shell__content" id={mainId ?? undefined} tabindex={mainId ? -1 : undefined}>
      {@render children?.()}
    </div>
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
    transition: margin-left 20ms linear;
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
    /* AppList/AppForm usam flex:1 aqui — overflow:hidden para conter o scroll deles */
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @media (max-width: 899px) {
    .ca-sidebar {
      display: none;
    }

    .ca-main {
      margin-left: 0 !important;
      /* Bottom nav is fixed: reserve its height plus the home-indicator inset. */
      padding-bottom: calc(var(--ca-bottom-nav-h, 56px) + var(--ca-safe-bottom));
    }

    .ca-shell__desktop-header {
      display: none !important;
    }

    .ca-shell__mobile-header {
      display: flex !important;
    }
  }
</style>

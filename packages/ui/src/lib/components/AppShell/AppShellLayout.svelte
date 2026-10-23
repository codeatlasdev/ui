<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { Spring } from 'svelte/motion';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import type { NavExtras, NavModule, NavMoreSheetProps } from './types.js';
  import { clampPanelWidth, findActiveItem, firstModulePath, isNavSection, matchModuleIndex, PANEL_WIDTH, RAIL_WIDTH } from './types.js';
  import { readShellState, shellScript, writeShellState } from './shell-state.js';
  import Rail from './Rail.svelte';
  import Panel from './Panel.svelte';
  import MobileHeader from './MobileHeader.svelte';
  import BottomNav from './BottomNav.svelte';
  import SkipLink from '../SkipLink/SkipLink.svelte';

  interface Props {
    modules:        NavModule[];
    /**
     * Hides modules the current user may not see (role, plan, feature flag). Rail, panel, bottom
     * navigation and the active-module logic all work on the filtered list, so indexes never point
     * at a hidden module. Return `true` to keep a module.
     */
    filterModules?: (module: NavModule) => boolean;
    pathname:       string;
    onNavigate?:    (path: string) => void;
    defaultModule?: number;
    /**
     * Keeps the shell across page loads: panel open/closed, selected module, expanded sections
     * (localStorage) and the panel scroll (sessionStorage), restored before first paint. Turn it
     * off for demos and embeds that must always start from the defaults.
     */
    persistPanel?:  boolean;
    /**
     * Width of the navigation panel in px, for lists with long labels. Held between 160 and 480.
     * The content offset and the open/close animation follow it. With `resizablePanel` it is the
     * width used until the user drags the edge.
     */
    panelWidth?:    number;
    /**
     * Adds a drag handle (a keyboard-operable separator) on the panel's trailing edge. The width
     * the user picks is kept with `persistPanel`, like the open state, and restored before paint.
     */
    resizablePanel?: boolean;
    /**
     * Collapses the panel to the rail for a module with 2 destinations or fewer, so a short list
     * does not reserve a whole column of empty background. Off by default: a 2-item panel stays
     * open (a single-destination module never shows one either way). Opening the panel for a
     * longer module still works.
     */
    collapseShortPanel?: boolean;
    /**
     * Enables `onReorder` on sections and modules: pass the exported `NavReorder` component.
     * Opt-in so the drag engine is only bundled by apps that reorder.
     */
    reorder?:       NavExtras['reorder'];
    /**
     * Renders `NavItem.actions` as a "…" menu: pass the exported `NavItemMenu` component.
     * Opt-in so DropdownMenu is only bundled by apps that use per-item menus.
     */
    itemMenu?:      NavExtras['itemMenu'];
    /**
     * A persistent background layer (map, canvas, video, 3D scene) rendered ONCE, full-bleed under
     * the content and beside the Rail / above the BottomNav, so it keeps its state (camera, GPU
     * context, selection) while the pages change. The snippet receives `{ hidden }`: pause rendering
     * while it is true. The content region passes pointer events through to the stage; give a page's
     * panels `class="ca-stage-panel"` (or `pointer-events: auto`) to keep them interactive. The shell
     * paints nothing behind the content when a stage is set, so the stage shows.
     */
    stage?:         Snippet<[{ hidden: boolean }]>;
    /**
     * `false` hides the stage (`visibility: hidden`, `inert`) and tells it to pause, without
     * unmounting it: for a full-page route that covers it. A page can also set
     * `data-ca-stage="hidden"` on `<html>` (what `PageFrame mode="page"` does).
     */
    stageVisible?:  boolean;
    header?:        Snippet;
    /** Brand mark (logo) shown at the top of the Rail and in the mobile header. */
    brand?:         Snippet;
    /** Items pinned to the bottom of the Rail (avatar, notifications…) */
    railBottom?:    Snippet;
    /** Control between the brand and the modules in the Rail, e.g. a search / ⌘K trigger. */
    railTop?:       Snippet;
    /** Shows each module's label as a caption under its rail icon. */
    railLabels?:    boolean;
    /**
     * Most tabs on the mobile bottom navigation. With more modules the first `bottomNavPrimary - 1`
     * stay and the last tab is "More", a dialog with the rest. Default 5.
     */
    bottomNavPrimary?: number;
    /**
     * Replaces the built-in "More" dialog with another component: pass the exported `NavMoreSheet`
     * for a full `Sheet` (swipe to dismiss, exit animation). Opt-in because `Sheet` adds about 10 kB
     * gzip to the shell; the built-in dialog is a plain native `<dialog>` and costs about 1 kB.
     */
    moreSheet?: Component<NavMoreSheetProps>;
    /** Extra content in the "More" dialog under the modules (search, account, sign out). */
    bottomNavOverflow?: Snippet;
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
    modules: allModules,
    filterModules,
    pathname,
    onNavigate,
    defaultModule = 0,
    persistPanel  = true,
    panelWidth    = PANEL_WIDTH,
    resizablePanel = false,
    collapseShortPanel = false,
    reorder,
    itemMenu,
    stage,
    stageVisible = true,
    header,
    brand,
    railBottom,
    railTop,
    railLabels = false,
    bottomNavPrimary,
    moreSheet,
    bottomNavOverflow,
    mobileHeaderActions,
    mobileTitle,
    mainId = 'main',
    skipLink = true,
    children,
  }: Props = $props();

  // Every index below (rail, panel, bottom nav, active module) refers to this filtered list.
  let modules = $derived(filterModules ? allModules.filter(filterModules) : allModules);

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
    return saved >= 0 ? saved : Math.max(0, Math.min(defaultModule, modules.length - 1));
  }

  let panelOpen = $state(stored?.panel ?? true);

  // The width the user dragged to wins over the `panelWidth` default, and only for a resizable
  // panel: on a fixed one the prop is the contract, whatever an earlier version stored.
  // svelte-ignore state_referenced_locally
  let dragged = $state<number | null>(resizablePanel && stored?.panelWidth !== undefined ? clampPanelWidth(stored.panelWidth) : null);
  let width = $derived(resizablePanel && dragged !== null ? dragged : clampPanelWidth(panelWidth));
  // While the pointer holds the edge the panel is exactly where the pointer is: no spring in between.
  let resizing = $state(false);
  // svelte-ignore state_referenced_locally
  let selectedIndex = $state(resolveModule(pathname));

  let activeModuleIndex = $derived(resolveModule(pathname));
  $effect(() => { selectedIndex = activeModuleIndex; });

  // Current page title for MobileHeader: active item label, fallback to module label
  let pageTitle = $derived.by(() => {
    const mod = modules[activeModuleIndex];
    if (!mod) return '';
    return findActiveItem(mod.items, pathname)?.label ?? mod.label;
  });

  function setPanelOpen(v: boolean) {
    panelOpen = v;
    if (persistPanel) writeShellState({ panel: v });
  }

  // A panel listing a single destination only repeats the rail icon and the
  // page title, so it is skipped for modules with fewer than two leaves
  // (fewer than three with `collapseShortPanel`).
  let selectedHasChoices = $derived.by(() => {
    const mod = modules[selectedIndex];
    if (!mod) return false;
    let leaves = 0;
    for (const entry of mod.items) leaves += isNavSection(entry) ? entry.items.length : 1;
    return leaves > (collapseShortPanel ? 2 : 1);
  });
  let panelVisible = $derived(panelOpen && selectedHasChoices);

  // One spring drives the panel width and the main margin so they stay in lock-step.
  // precision 0.5px: a layout pixel is the smallest visible step, and the Spring snaps to
  // the exact target once within it, so the offset settles on an integer (252, not 251.984).
  // It starts AT the target (no open animation on load): a reload must not replay the slide.
  // svelte-ignore state_referenced_locally
  const panelW = new Spring(panelVisible ? width : 0, { stiffness: 0.22, damping: 0.88, precision: 0.5 });
  $effect(() => {
    // Reduced motion and a held drag edge: jump straight to the target, no frames in between.
    panelW.set(panelVisible ? width : 0, { instant: reducedMotion.value || resizing });
  });

  function resizeTo(next: number) {
    dragged = next;
  }
  function commitWidth(next: number) {
    dragged = next;
    if (persistPanel) writeShellState({ panelWidth: next });
  }

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

  // What the shell chrome covers, for anything laid out over or behind the content (a map's padding,
  // a floating panel): rail + panel on desktop; 0 below 900px, where the CSS takes over top/bottom.
  let insetLeft = $derived(RAIL_WIDTH + panelW.current);

  // A page outside the component (PageFrame mode="page") can hide the stage through <html>.
  let htmlHidden = $state(false);
  $effect(() => {
    if (!stage) return;
    const root = document.documentElement;
    const read = () => (htmlHidden = root.getAttribute('data-ca-stage') === 'hidden');
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['data-ca-stage'] });
    return () => mo.disconnect();
  });
  let stageHidden = $derived(!stageVisible || htmlHidden);

  setContext<NavExtras>('appshell-nav-extras', {
    get reorder()  { return reorder; },
    get itemMenu() { return itemMenu; },
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
<div class="ca-shell" class:ca-shell--stage={!!stage} style="--ca-shell-inset-left: {insetLeft}px">
  <!-- Desktop only sidebar -->
  <div class="ca-sidebar">
    <Rail
      {modules}
      activeIndex={selectedIndex}
      {brand}
      top={railTop}
      labels={railLabels}
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
      resizable={resizablePanel}
      width={width}
      onResize={resizeTo}
      onCommit={commitWidth}
      onResizing={(v) => (resizing = v)}
    />
  </div>
  {#if persistPanel}{@html shellScript(modules.map((m) => m.id), resizablePanel)}{/if}

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
    <div class="ca-shell__body">
    {#if stage}
      <!-- Rendered once: it sits outside the content block, so a route change never remounts it.
           inert while hidden: no focus, no clicks, not in the a11y tree. -->
      <div class="ca-shell__stage" class:ca-shell__stage--hidden={stageHidden} inert={stageHidden || undefined}>
        {@render stage({ hidden: stageHidden })}
      </div>
    {/if}
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
  </div>

  <!-- Mobile bottom nav -->
  <BottomNav
    {modules}
    primary={bottomNavPrimary}
    {moreSheet}
    overflow={bottomNavOverflow}
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
      /* The space the shell chrome takes on each side of the content region. Desktop: the rail and
         panel (left, inline style: it follows the spring) and the optional header (top).
         Below 900px: the mobile header (top) and the bottom nav + home-indicator inset (bottom). */
      --ca-shell-inset-top: 0px;
      --ca-shell-inset-right: 0px;
      --ca-shell-inset-bottom: 0px;
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
    /*
     * A resized panel: the server renders the `panelWidth` default and `shellScript` puts the stored
     * width in --ca-panel-w-stored on <html>, so the panel and the offset paint at it from the first frame.
     */
    :global(html[style*='--ca-panel-w-stored']:not([data-ca-panel='closed']):not([data-ca-hydrated])) .ca-main {
      margin-left: calc(var(--ca-rail-width) + var(--ca-panel-w-stored)) !important;
    }
    :global(html[style*='--ca-panel-w-stored']:not([data-ca-hydrated])) :global(.ca-panel) {
      width: var(--ca-panel-w-stored) !important;
    }

    .ca-shell__desktop-header {
      display: block;
    }

    .ca-shell__mobile-header {
      display: none !important;
    }

    /* Holds the stage and the content; takes the flex slot the content used to own. */
    .ca-shell__body {
      position: relative;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    /* The stage fills the body (so it already stops at the rail, under the headers and above the
       bottom nav: --ca-main-ml and the main padding are the insets). */
    .ca-shell__stage {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }
    .ca-shell__stage--hidden {
      visibility: hidden;
    }

    /* With a stage the content floats over it: the region is click-through, panels opt back in. */
    .ca-shell--stage .ca-shell__content {
      position: relative;
      z-index: 1;
      pointer-events: none;
    }
    .ca-shell--stage :global(.ca-stage-panel) {
      pointer-events: auto;
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
      .ca-shell {
        --ca-shell-inset-left: 0px !important;
        --ca-shell-inset-top: calc(var(--ca-space-12) + var(--ca-safe-top));
        --ca-shell-inset-bottom: calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom));
      }

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

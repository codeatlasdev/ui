<script lang="ts">
  import { getContext } from 'svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import type { NavModule } from './types.js';
  import { isNavSection } from './types.js';
  import PanelNavItem from './PanelNavItem.svelte';
  import SectionGroup from './SectionGroup.svelte';
  import { readShellScroll, saveShellScroll } from './shell-state.js';
  const t = useT();

  interface Props {
    modules:           NavModule[];
    activeModuleIndex: number;
    pathname:          string;
    show:              boolean;
    panelW:            number;
    class?:            string;
  }

  let { modules, activeModuleIndex, pathname, show, panelW, class: className = '' }: Props = $props();

  let activeModule = $derived(modules[activeModuleIndex]);

  // Only inside an AppShellLayout with persistPanel (a bare Panel keeps nothing).
  const persist = getContext<{ readonly enabled: boolean } | undefined>('appshell-persist');

  let nav = $state<HTMLElement | null>(null);

  // Scroll is saved per module, so switching module in the rail never lands mid-list of another one.
  // The inline `shellScript` already restored the first one before paint; this covers module
  // switches and client-side navigation. Saved on scroll (debounced) and on pagehide.
  $effect(() => {
    const el = nav;
    const id = activeModule?.id;
    if (!el || !id || !persist?.enabled) return;
    el.scrollTop = readShellScroll()[id] ?? 0;
    let timer: ReturnType<typeof setTimeout>;
    // A hidden nav (below 900px the sidebar is display:none) reads scrollTop 0: keep the saved value.
    const save = () => {
      if (el.clientHeight > 0) saveShellScroll(id, el.scrollTop);
    };
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 100);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', save);
    };
  });
</script>

{#if show || panelW > 1}
  <aside
    class="ca-panel {className}"
    data-ca-blur="mat-regular"
    aria-label={t().appShell.sectionNavigation}
    style="--panel-w:{panelW}px; --panel-opacity:{panelW < 20 ? panelW / 20 : 1}"
  >
    <!-- Module header -->
    <div class="ca-panel__header">
      <span class="ca-panel__title">{activeModule?.label ?? ''}</span>
    </div>

    <!-- Nav items with top/bottom fade mask -->
    <nav class="ca-panel__nav" bind:this={nav}>
      {#if activeModule}
        {#each activeModule.items as item}
          {#if isNavSection(item)}
            <SectionGroup section={item} {pathname} />
          {:else}
            <PanelNavItem
              {item}
              isActive={pathname === item.path || pathname.startsWith(item.path + '/')}
              href={item.path}
            />
          {/if}
        {/each}
      {/if}
    </nav>
  </aside>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-panel {
      height: 100%;
      flex-shrink: 0;
      overflow: hidden; /* clip while animating */
      display: flex;
      flex-direction: column;
      width: var(--panel-w, var(--ca-panel-width));
      opacity: var(--panel-opacity, 1);
      background: var(--ca-glass-bg);
      box-shadow: var(--ca-glass-separator);
    }

    .ca-panel__header {
      height: var(--ca-header-height);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      padding: 0 var(--ca-space-3);
      box-shadow: inset 0 calc(var(--ca-border-width) * -1) 0 var(--ca-outline-subtle);
    }

    .ca-panel__title {
      font-size: var(--ca-font-size-label);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-semibold);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ca-panel__nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--ca-space-1-5) var(--ca-space-2) var(--ca-space-4);
      -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        black var(--ca-space-2),
        black calc(100% - var(--ca-space-4)),
        transparent 100%
      );
      mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        black var(--ca-space-2),
        black calc(100% - var(--ca-space-4)),
        transparent 100%
      );
    }
    .ca-panel__nav::-webkit-scrollbar { display: none; }
}
</style>

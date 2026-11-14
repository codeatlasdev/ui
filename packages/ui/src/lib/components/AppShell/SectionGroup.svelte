<script lang="ts">
  import { getContext } from 'svelte';
  import type { NavItem, NavSection } from './types.js';
  import { isItemActive } from './types.js';
  import NavList from './NavList.svelte';
  import { readSectionOpen, sectionKey, writeSectionOpen } from './shell-state.js';
  import { ChevronRight } from '@lucide/svelte';
  import { createIds, createPresence } from '../../primitives/index.js';

  interface Props {
    section: NavSection;
    pathname: string;
    /** Decides which link is current (the shell passes the module-wide winner); defaults to `isItemActive`. */
    active?: (item: NavItem) => boolean;
    /**
     * `id` of the module the section belongs to (`Panel` sets it). The open state is kept under
     * `<moduleId>/<label>`, so the same label in two modules is two sections.
     */
    moduleId?: string;
    /** Open state when `section.defaultOpen` is not set (`AppShellLayout` passes `sectionsDefaultOpen`). */
    defaultOpen?: boolean;
    class?: string;
  }

  let { section, pathname, active, moduleId, defaultOpen = true, class: className = '' }: Props = $props();

  // Path of this section's current page, if it holds it. A string, so a rebuilt `items` array with
  // the same current page does not count as a navigation.
  const activePath = $derived(
    section.items.find((item) => (active ? active(item) : isItemActive(item, pathname)))?.path
  );

  // Only inside an AppShellLayout with persistPanel (a bare SectionGroup keeps nothing).
  const persist = getContext<{ readonly enabled: boolean } | undefined>('appshell-persist');
  // Choices made since the panel mounted (`Panel` remounts its sections on a module switch).
  const memory = getContext<Map<string, boolean> | undefined>('appshell-sections');

  // The user's last choice (this panel's memory, then storage) wins over `defaultOpen`; the active
  // section is never hidden on load. Key and defaults are init-only on purpose.
  // svelte-ignore state_referenced_locally
  const { label } = section;
  // svelte-ignore state_referenced_locally
  const key = label ? sectionKey(moduleId, label) : '';
  // svelte-ignore state_referenced_locally
  const saved = label
    ? (memory?.get(key) ?? (persist?.enabled ? readSectionOpen(moduleId, label) : undefined))
    : undefined;
  // svelte-ignore state_referenced_locally
  let open = $state(activePath !== undefined || (saved ?? section.defaultOpen ?? defaultOpen));

  // Navigating to a page inside the section opens it. It runs only when the current page changes, so
  // a section the user closes while on one of its pages stays closed until they navigate again.
  $effect.pre(() => {
    if (activePath !== undefined) open = true;
  });

  function toggle() {
    open = !open;
    if (!label) return;
    memory?.set(key, open);
    if (persist?.enabled) writeSectionOpen(moduleId, label, open);
  }

  const uid = $props.id();
  const ids = createIds(uid);
  const presence = createPresence(() => open);
  const dataState = $derived(open ? 'open' : 'closed');
</script>

<div class="ca-section {className}">
  {#if section.label}
    {#if section.collapsible !== false}
      <div data-state={dataState}>
        <button
          type="button"
          class="ca-section__trigger"
          aria-expanded={open}
          aria-controls={ids.part('content')}
          data-state={dataState}
          onclick={toggle}
        >
          <span class="ca-section__label">{section.label}</span>
          <span
            class="ca-section__chevron"
            class:ca-section__chevron--open={open}
            aria-hidden="true"
          >
            <ChevronRight size={12} stroke-width={2} />
          </span>
        </button>
        <div id={ids.part('content')} data-state={dataState} hidden={!presence.present} {@attach presence.ref}>
          <NavList items={section.items} {pathname} {active} onReorder={section.onReorder} label={section.label} />
        </div>
      </div>
    {:else}
      <div class="ca-section__header">
        <span class="ca-section__label">{section.label}</span>
      </div>
      <NavList items={section.items} {pathname} {active} onReorder={section.onReorder} label={section.label} />
    {/if}
  {:else}
    <NavList items={section.items} {pathname} {active} onReorder={section.onReorder} label={section.label} />
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-section {
      margin-top: var(--ca-space-1);
    }
    .ca-section:first-child {
      margin-top: 0;
    }

    .ca-section__header,
    :global(.ca-section__trigger) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--ca-space-2-5) var(--ca-space-3) var(--ca-space-1);
      background: transparent;
      border: none;
      cursor: pointer;
    }

    .ca-section__label {
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      letter-spacing: var(--ca-overline-tracking);
      text-transform: uppercase;
      color: var(--ca-text-hint);
    }

    .ca-section__chevron {
      color: var(--ca-text-hint);
      display: flex;
      align-items: center;
      opacity: 0;
      transition:
        transform var(--ca-duration-fast) var(--ca-ease-standard),
        opacity var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-section__trigger:hover) .ca-section__chevron {
      opacity: 1;
    }

    .ca-section__chevron--open {
      transform: rotate(90deg);
    }
}
</style>

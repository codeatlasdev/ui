<script lang="ts">
  import type { NavSection } from './types.js';
  import { isItemActive } from './types.js';
  import PanelNavItem from './PanelNavItem.svelte';
  import { ChevronRight } from '@lucide/svelte';
  import { createIds, createPresence } from '../../primitives/index.js';

  interface Props {
    section: NavSection;
    pathname: string;
    class?: string;
  }

  let { section, pathname, class: className = '' }: Props = $props();

  const hasActiveChild = $derived(
    section.items.some((item) => isItemActive(item, pathname))
  );

  // defaultOpen is init-only on purpose.
  // svelte-ignore state_referenced_locally
  let open = $state(section.defaultOpen !== false || hasActiveChild);

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
          onclick={() => (open = !open)}
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
          {#each section.items as item}
            <PanelNavItem
              {item}
              isActive={isItemActive(item, pathname)}
              href={item.path}
            />
          {/each}
        </div>
      </div>
    {:else}
      <div class="ca-section__header">
        <span class="ca-section__label">{section.label}</span>
      </div>
      {#each section.items as item}
        <PanelNavItem
          {item}
          isActive={isItemActive(item, pathname)}
          href={item.path}
        />
      {/each}
    {/if}
  {:else}
    {#each section.items as item}
      <PanelNavItem
        {item}
        isActive={isItemActive(item, pathname)}
        href={item.path}
      />
    {/each}
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

<script lang="ts">
  import { Collapsible } from 'bits-ui';
  import type { NavSection } from './types.js';
  import { isItemActive } from './types.js';
  import PanelNavItem from './PanelNavItem.svelte';
  import { ChevronRight } from '@lucide/svelte';

  interface Props {
    section: NavSection;
    pathname: string;
    class?: string;
  }

  let { section, pathname, class: className = '' }: Props = $props();

  const hasActiveChild = $derived(
    section.items.some((item) => isItemActive(item, pathname))
  );

  // svelte-ignore state_referenced_locally: intentional: defaultOpen is init-only
  let open = $state(section.defaultOpen !== false || hasActiveChild);
</script>

<div class="ca-section {className}">
  {#if section.label}
    {#if section.collapsible !== false}
      <Collapsible.Root bind:open>
        <Collapsible.Trigger class="ca-section__trigger">
          <span class="ca-section__label">{section.label}</span>
          <span
            class="ca-section__chevron"
            class:ca-section__chevron--open={open}
            aria-hidden="true"
          >
            <ChevronRight size={12} stroke-width={2} />
          </span>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {#each section.items as item}
            <PanelNavItem
              {item}
              isActive={isItemActive(item, pathname)}
              href={item.path}
            />
          {/each}
        </Collapsible.Content>
      </Collapsible.Root>
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
  .ca-section {
    margin-top: 4px;
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
    padding: 10px 12px 4px;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .ca-section__label {
    font-size: var(--ca-font-size-micro);
    font-weight: 600;
    letter-spacing: 0.05em;
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
</style>

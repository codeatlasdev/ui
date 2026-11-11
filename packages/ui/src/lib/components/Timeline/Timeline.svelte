<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { createIds } from '../../primitives/index.js';
  import type { IconComponent } from '../../types.js';

  export interface TimelineItem {
    label: string;
    description?: string;
    date?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
    /** Leading icon: replaces the dot in the track (decorative; the label carries the meaning). */
    icon?: IconComponent;
    /** Short text badge next to the label: a duration, an outcome. */
    meta?: string;
    /** Collapsible detail. The label becomes the button of a disclosure that shows it. */
    children?: Snippet;
    /** Start with the detail expanded. */
    open?: boolean;
  }

  interface Props {
    items: TimelineItem[];
    class?: string;
  }

  let { items, class: className = '' }: Props = $props();

  const uid = $props.id();
  const ids = createIds(uid);
  // Index -> expanded, only for the entries the user toggled; an untouched entry reads `item.open`.
  let toggled = $state<Record<number, boolean>>({});
  const isOpen = (item: TimelineItem, i: number) => toggled[i] ?? item.open ?? false;
</script>

<ol class="ca-timeline {className}">
  {#each items as item, i}
    {@const Icon = item.icon}
    {@const expanded = isOpen(item, i)}
    <li class="ca-timeline__item">
      <div class="ca-timeline__track">
        {#if Icon}
          <span class="ca-timeline__icon ca-timeline__icon--{item.variant ?? 'default'}" aria-hidden="true">
            <Icon size={14} />
          </span>
        {:else}
          <div class="ca-timeline__dot ca-timeline__dot--{item.variant ?? 'default'}"></div>
        {/if}
        {#if i < items.length - 1}
          <div class="ca-timeline__connector"></div>
        {/if}
      </div>
      <div class="ca-timeline__content">
        <div class="ca-timeline__header">
          {#if item.children}
            <button
              type="button"
              class="ca-timeline__toggle"
              aria-expanded={expanded}
              aria-controls={ids.item('detail', i)}
              onclick={() => (toggled[i] = !expanded)}
            >
              <span class="ca-timeline__label">{item.label}</span>
              <ChevronDown size={14} class="ca-timeline__chevron" aria-hidden="true" />
            </button>
          {:else}
            <span class="ca-timeline__label">{item.label}</span>
          {/if}
          {#if item.meta}
            <span class="ca-timeline__meta">{item.meta}</span>
          {/if}
          {#if item.date}
            <time class="ca-timeline__date">{item.date}</time>
          {/if}
        </div>
        {#if item.description}
          <p class="ca-timeline__desc">{item.description}</p>
        {/if}
        {#if item.children}
          <div id={ids.item('detail', i)} class="ca-timeline__detail" hidden={!expanded}>
            {@render item.children()}
          </div>
        {/if}
      </div>
    </li>
  {/each}
</ol>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    .ca-timeline__item {
      display: flex;
      gap: var(--ca-space-4);
      min-height: var(--ca-space-12);
    }

    .ca-timeline__track {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: var(--ca-space-5);
    }

    .ca-timeline__dot {
      width: var(--ca-space-3);
      height: var(--ca-space-3);
      border-radius: 50%;
      flex-shrink: 0;
      border: var(--ca-border-width-strong) solid var(--ca-outline-default);
      background: var(--ca-surface-base);
      margin-top: var(--ca-space-1);
    }

    .ca-timeline__dot--default { border-color: var(--ca-outline-default); }
    .ca-timeline__dot--success { border-color: var(--ca-semantic-success); background: var(--ca-semantic-success); }
    .ca-timeline__dot--error   { border-color: var(--ca-semantic-error);   background: var(--ca-semantic-error); }
    .ca-timeline__dot--warning { border-color: var(--ca-semantic-warning); background: var(--ca-semantic-warning); }
    .ca-timeline__dot--info    { border-color: var(--ca-semantic-info);    background: var(--ca-semantic-info); }

    .ca-timeline__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--ca-space-5);
      height: var(--ca-space-5);
      border-radius: 50%;
      color: var(--ca-text-secondary);
      background: var(--ca-surface-base);
      border: var(--ca-border-width-strong) solid var(--ca-outline-default);
    }

    .ca-timeline__icon--success { color: var(--ca-semantic-success); border-color: var(--ca-semantic-success); }
    .ca-timeline__icon--error   { color: var(--ca-semantic-error);   border-color: var(--ca-semantic-error); }
    .ca-timeline__icon--warning { color: var(--ca-semantic-warning); border-color: var(--ca-semantic-warning); }
    .ca-timeline__icon--info    { color: var(--ca-semantic-info);    border-color: var(--ca-semantic-info); }

    .ca-timeline__connector {
      flex: 1;
      width: var(--ca-border-width-strong);
      background: var(--ca-outline-subtle);
      margin-block: var(--ca-space-1);
    }

    .ca-timeline__content {
      flex: 1;
      padding-bottom: var(--ca-space-6);
    }

    .ca-timeline__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ca-space-3);
      flex-wrap: wrap;
    }

    .ca-timeline__header:has(.ca-timeline__toggle) {
      align-items: center;
    }

    .ca-timeline__label {
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
    }

    .ca-timeline__meta {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      padding-inline: var(--ca-space-2);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-action-hover);
      flex-shrink: 0;
    }

    .ca-timeline__toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      min-height: var(--ca-touch-target);
      /* The hit area is taller than the label line: the extra height is pulled back so the label stays level with the marker. */
      margin-block: calc((1lh - var(--ca-touch-target)) / 2);
      padding: 0;
      background: none;
      border: 0;
      font: inherit;
      color: inherit;
      text-align: start;
    }

    .ca-timeline__toggle :global(.ca-timeline__chevron) {
      color: var(--ca-text-hint);
      transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-timeline__toggle[aria-expanded='true'] :global(.ca-timeline__chevron) {
      transform: rotate(180deg);
    }

    .ca-timeline__detail {
      margin-top: var(--ca-space-2);
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
    }

    .ca-timeline__date {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
      flex-shrink: 0;
    }

    .ca-timeline__desc {
      margin: var(--ca-space-1) 0 0;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      line-height: var(--ca-line-height-relaxed);
    }
}
</style>

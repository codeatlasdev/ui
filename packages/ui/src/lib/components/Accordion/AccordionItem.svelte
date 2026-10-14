<script lang="ts">
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { createIds, createPresence } from '../../primitives/index.js';
  import { ACCORDION_KEY, type AccordionContext } from './Accordion.svelte';

  interface Props {
    value: string;
    title: string;
    class?: string;
    children?: Snippet;
  }

  let { value, title, class: className = '', children }: Props = $props();

  const accordion = getContext<AccordionContext | undefined>(ACCORDION_KEY);
  if (!accordion) throw new Error('AccordionItem must be used inside <Accordion>');

  const uid = $props.id();
  const ids = createIds(uid);
  const open = $derived(accordion.isOpen(value));
  const presence = createPresence(() => open);
  const dataState = $derived(open ? 'open' : 'closed');

  let content = $state<HTMLElement>();

  // Natural height drives the open/close height animation (CSS reads --ca-accordion-height).
  $effect(() => {
    if (content && presence.present) {
      content.style.setProperty('--ca-accordion-height', `${content.scrollHeight}px`);
    }
  });
</script>

<div class="ca-accordion-item {className}" data-state={dataState} data-orientation="vertical">
  <h2 class="ca-accordion-item__header" data-state={dataState} data-orientation="vertical">
    <button
      type="button"
      id={ids.part('trigger')}
      class="ca-accordion-item__trigger"
      aria-expanded={open}
      aria-controls={ids.part('content')}
      data-state={dataState}
      data-orientation="vertical"
      onclick={() => accordion.toggle(value)}
    >
      <span class="ca-accordion-item__title">{title}</span>
      <span class="ca-accordion-item__chevron" aria-hidden="true">
        <ChevronDown size={16} stroke-width={2} />
      </span>
    </button>
  </h2>
  <div
      bind:this={content}
      {@attach presence.ref}
      id={ids.part('content')}
      class="ca-accordion-item__content"
      role="region"
      aria-labelledby={ids.part('trigger')}
      data-state={dataState}
      data-orientation="vertical"
      hidden={!presence.present}
    >
      <div class="ca-accordion-item__body">
        {@render children?.()}
      </div>
    </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-accordion-item) {
      background: var(--ca-glass-tint-ultra-thin);
      -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
      backdrop-filter: var(--ca-blur-ultra-thin);
      border: var(--ca-border-width) solid var(--ca-glass-border);
      border-radius: var(--ca-radius-lg);
      overflow: hidden;
    }

    :global(.ca-accordion-item__header) {
      margin: 0;
      padding: 0;
    }

    :global(.ca-accordion-item__trigger) {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: var(--ca-space-12);
      padding: 0 var(--ca-space-4);
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: var(--ca-font-sans);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      text-align: left;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-accordion-item__trigger:hover) {
      background: var(--ca-action-hover);
    }

    :global(.ca-accordion-item__trigger:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(-1 * var(--ca-border-width-focus));
    }

    :global(.ca-accordion-item__trigger[data-state='open'] .ca-accordion-item__chevron) {
      transform: rotate(180deg);
    }

    :global(.ca-accordion-item__title) {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :global(.ca-accordion-item__chevron) {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      color: var(--ca-text-secondary);
      transition: transform var(--ca-duration-base) var(--ca-ease-spring);
    }

    :global(.ca-accordion-item__content) {
      overflow: hidden;
    }

    :global(.ca-accordion-item__content[data-state='closed']) {
      animation: ca-accordion-up var(--ca-duration-base) var(--ca-ease-standard);
    }

    :global(.ca-accordion-item__content[data-state='open']) {
      animation: ca-accordion-down var(--ca-duration-base) var(--ca-ease-standard);
    }

    :global(.ca-accordion-item__body) {
      padding: 0 var(--ca-space-4) var(--ca-space-4);
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      line-height: var(--ca-line-height-prose);
    }

    @keyframes ca-accordion-down {
      from { height: 0; opacity: 0; }
      to { height: var(--ca-accordion-height); opacity: 1; }
    }

    @keyframes ca-accordion-up {
      from { height: var(--ca-accordion-height); opacity: 1; }
      to { height: 0; opacity: 0; }
    }
}
</style>

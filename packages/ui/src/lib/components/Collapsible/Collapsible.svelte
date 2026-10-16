<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { createIds, createPresence } from '../../primitives/index.js';

  interface Props {
    title: string;
    open?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
    class?: string;
    children?: Snippet;
  }

  let {
    title,
    open = $bindable(false),
    disabled = false,
    onOpenChange,
    class: className = '',
    children,
  }: Props = $props();

  const uid = $props.id();
  const ids = createIds(uid);
  const presence = createPresence(() => open);
  const dataState = $derived(open ? 'open' : 'closed');

  let content = $state<HTMLElement>();

  function toggle() {
    if (disabled) return;
    open = !open;
    onOpenChange?.(open);
  }

  // Natural height drives the open/close height animation (CSS reads --ca-collapsible-height).
  function measure(node: HTMLElement) {
    node.style.setProperty('--ca-collapsible-height', `${node.scrollHeight}px`);
  }

  $effect(() => {
    if (content && presence.present) measure(content);
  });
</script>

<div
  class="ca-collapsible {className}"
  data-state={dataState}
  data-disabled={disabled ? '' : undefined}
>
  <button
    type="button"
    id={ids.part('trigger')}
    class="ca-collapsible__trigger"
    data-ca-blur="ultra-thin"
    aria-expanded={open}
    aria-controls={ids.part('content')}
    data-state={dataState}
    data-disabled={disabled ? '' : undefined}
    {disabled}
    onclick={toggle}
  >
    <span class="ca-collapsible__title">{title}</span>
    <ChevronDown size={16} class="ca-collapsible__chevron" />
  </button>
  <div
      bind:this={content}
      {@attach presence.ref}
      id={ids.part('content')}
      class="ca-collapsible__content"
      data-state={dataState}
      data-disabled={disabled ? '' : undefined}
      hidden={!presence.present}
    >
      <div class="ca-collapsible__body">
        {@render children?.()}
      </div>
    </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-collapsible) {
      display: flex;
      flex-direction: column;
    }

    :global(.ca-collapsible__trigger) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--ca-space-3) var(--ca-space-4);
      background: var(--ca-glass-bg);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      cursor: pointer;
      font-size: var(--ca-font-size-body1);
      color: var(--ca-text-primary);
      font-family: inherit;
      text-align: left;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-collapsible__trigger:hover) {
      background: var(--ca-action-hover);
    }

    :global(.ca-collapsible[data-state="open"] .ca-collapsible__trigger) {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom-color: transparent;
    }

    :global(.ca-collapsible__title) {
      font-weight: var(--ca-font-weight-medium);
    }

    :global(.ca-collapsible__chevron) {
      color: var(--ca-text-secondary);
      flex-shrink: 0;
      transition: transform var(--ca-duration-base) var(--ca-ease-spring);
    }

    :global(.ca-collapsible[data-state="open"] .ca-collapsible__chevron) {
      transform: rotate(180deg);
    }

    :global(.ca-collapsible__content) {
      overflow: hidden;
    }

    :global(.ca-collapsible__content[data-state="open"]) {
      animation: ca-slide-down var(--ca-duration-base) var(--ca-ease-decelerate);
    }

    :global(.ca-collapsible__content[data-state="closed"]) {
      animation: ca-slide-up var(--ca-duration-base) var(--ca-ease-accelerate);
    }

    :global(.ca-collapsible__body) {
      padding: var(--ca-space-3-5) var(--ca-space-4);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-top: none;
      border-radius: 0 0 var(--ca-radius-md) var(--ca-radius-md);
    }

    @keyframes ca-slide-down {
      from { height: 0; opacity: 0; }
      to { height: var(--ca-collapsible-height); opacity: 1; }
    }

    @keyframes ca-slide-up {
      from { height: var(--ca-collapsible-height); opacity: 1; }
      to { height: 0; opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      :global(.ca-collapsible__content[data-state]) {
        animation: none;
      }
    }
}
</style>

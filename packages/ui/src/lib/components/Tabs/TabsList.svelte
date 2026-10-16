<script lang="ts">
  import type { Snippet } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';
  import { getTabsContext } from './tabs-context.js';

  interface Props {
    /** Fade the edge(s) that still have tabs to scroll to, so the strip reads as scrollable. */
    fade?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { fade = false, class: className = '', children }: Props = $props();

  const tabs = getTabsContext();

  let list = $state<HTMLElement>();
  // Which edge(s) hide more tabs: "start" | "end" | "both"; undefined when everything fits.
  let hidden = $state<'start' | 'end' | 'both'>();

  // Arrow keys / Home / End move focus among enabled tabs; focus selects (automatic activation,
  // handled by each trigger's onfocus).
  function roving(node: HTMLElement) {
    return rovingFocus(node, { selector: '.ca-tabs-trigger', orientation: 'horizontal' });
  }

  function measure() {
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    // Sub-pixel scroll positions: treat < 1px as the edge.
    const atStart = Math.abs(list.scrollLeft) < 1;
    const atEnd = Math.abs(list.scrollLeft) > max - 1;
    hidden = max < 1 ? undefined : atStart ? 'end' : atEnd ? 'start' : 'both';
  }

  // Keep the selected trigger in view. Scrolls only the strip (never an ancestor or the window,
  // unlike scrollIntoView) and never moves focus.
  function reveal() {
    if (!list) return;
    const active = list.querySelector<HTMLElement>('.ca-tabs-trigger[data-state="active"]');
    if (!active) return;
    const box = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(list).scrollPaddingInline) || 0;
    if (rect.left < box.left + pad) list.scrollLeft += rect.left - box.left - pad;
    else if (rect.right > box.right - pad) list.scrollLeft += rect.right - box.right + pad;
  }

  $effect(() => {
    tabs.value;
    reveal();
  });

  $effect(() => {
    if (!list || !fade) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  });
</script>

<div
  bind:this={list}
  role="tablist"
  id={tabs.ids.part('list')}
  aria-orientation="horizontal"
  data-orientation="horizontal"
  data-fade={fade ? hidden : undefined}
  class="ca-tabs-list {className}"
  onscroll={fade ? measure : undefined}
  {@attach roving}
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Intrinsic width (a pill hugging its tabs) that never outgrows the column: past that it
       scrolls on its own with the scrollbar hidden. */
    :global(.ca-tabs-list) {
      display: flex;
      flex-direction: row;
      align-items: center;
      align-self: flex-start;
      gap: var(--ca-space-0-5);
      padding: var(--ca-space-1);
      box-sizing: border-box;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      scroll-snap-type: x proximity;
      scroll-padding-inline: var(--ca-space-1);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-glass-tint-ultra-thin);
      -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
      backdrop-filter: var(--ca-blur-ultra-thin);
      border: var(--ca-border-width) solid var(--ca-glass-border);
    }

    :global(.ca-tabs-list::-webkit-scrollbar) {
      display: none;
    }

    :global(.ca-tabs-list > *) {
      flex-shrink: 0;
      scroll-snap-align: start;
    }

    :global(.ca-tabs-list[data-fade='end']) {
      -webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-space-8)), transparent);
      mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-space-8)), transparent);
    }
    :global(.ca-tabs-list[data-fade='start']) {
      -webkit-mask-image: linear-gradient(to left, #000 calc(100% - var(--ca-space-8)), transparent);
      mask-image: linear-gradient(to left, #000 calc(100% - var(--ca-space-8)), transparent);
    }
    :global(.ca-tabs-list[data-fade='both']) {
      -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-8), #000 calc(100% - var(--ca-space-8)), transparent);
      mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-8), #000 calc(100% - var(--ca-space-8)), transparent);
    }
}
</style>

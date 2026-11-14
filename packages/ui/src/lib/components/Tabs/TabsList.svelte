<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../../primitives/index.js';
  import { getTabsContext } from './tabs-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    /** Fade the edge(s) that still have tabs to scroll to, so the strip reads as scrollable. */
    fade?: boolean;
    class?: string;
    children?: Snippet;
  }

  let { fade = false, class: className = '', children, onscroll, onfocusin, ...rest }: Props = $props();

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

  // Keep a trigger in view: the selected one when the value changes, the focused one on focus (focus and
  // selection can differ: a disabled neighbour, focus restored by a dialog). Scrolls only the strip (never
  // an ancestor or the window, unlike scrollIntoView) and never moves focus. The gutter is the strip's
  // `scroll-padding-inline`, the fade width while an edge is faded, so a revealed tab never sits under the
  // mask (#1076).
  function reveal(target?: HTMLElement | null) {
    if (!list) return;
    const el = target ?? list.querySelector<HTMLElement>('.ca-tabs-trigger[data-state="active"]');
    if (!el) return;
    const box = list.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
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
  {...rest}
  bind:this={list}
  role="tablist"
  id={tabs.ids.part('list')}
  aria-orientation="horizontal"
  data-orientation="horizontal"
  data-variant={tabs.variant}
  data-fill={tabs.fill ? '' : undefined}
  data-fade={fade ? hidden : undefined}
  class="ca-tabs-list {className}"
  data-ca-blur={tabs.variant === 'line' ? undefined : 'ultra-thin'}
  onscroll={(e) => {
    if (fade) measure();
    onscroll?.(e);
  }}
  onfocusin={(e) => {
    const t = e.target as HTMLElement;
    if (t.matches?.('.ca-tabs-trigger')) reveal(t);
    onfocusin?.(e);
  }}
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
      /* No scroll snapping: after a programmatic reveal it re-snapped to the nearest tab start and pulled
         the focused tab back under the edge (#1076). */
      scroll-padding-inline: var(--ca-space-1);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-glass-tint-ultra-thin);
      border: var(--ca-border-width) solid var(--ca-glass-border);
    }

    /* line: a bare strip with one hairline under it; each tab draws its own underline on top of it. */
    :global(.ca-tabs-list[data-variant='line']) {
      gap: var(--ca-space-1);
      padding: 0;
      border: none;
      border-radius: 0;
      background: transparent;
      box-shadow: inset 0 calc(-1 * var(--ca-border-width)) 0 var(--ca-outline-subtle);
    }

    /* fill: the list spans the container; the hairline (a box-shadow on the list) spans with it. */
    :global(.ca-tabs-list[data-fill]) {
      align-self: stretch;
    }

    :global(.ca-tabs-list::-webkit-scrollbar) {
      display: none;
    }

    :global(.ca-tabs-list > *) {
      flex-shrink: 0;
    }

    /* While an edge is faded the reveal gutter is the fade width, so a revealed or focused tab never sits
       under the mask (#1076). --ca-tabs-scroll-gutter overrides it. */
    :global(.ca-tabs-list[data-fade]) {
      scroll-padding-inline: var(--ca-tabs-scroll-gutter, var(--ca-space-8));
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

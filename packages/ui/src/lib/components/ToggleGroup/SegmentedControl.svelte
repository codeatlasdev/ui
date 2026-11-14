<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import type { ToggleGroupItem } from './ToggleGroup.svelte';

  interface Props {
    value?: string;
    items: ToggleGroupItem[];
    size?: 'sm' | 'md';
    disabled?: boolean;
    fullWidth?: boolean;
    /** `equal`: one shared column width. `content`: each segment is as wide as its label. */
    sizing?: 'equal' | 'content';
    class?: string;
    'aria-label'?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(),
    items,
    size = 'md',
    disabled = false,
    fullWidth = false,
    sizing = 'equal',
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();

  if (value === undefined) value = untrack(() => items.find((i) => !i.disabled)?.value ?? '');

  const index = $derived(items.findIndex((i) => i.value === value));

  // A segmented control always has a selection: pressing the active segment is a no-op.
  function select(item: ToggleGroupItem) {
    if (disabled || item.disabled || item.value === value) return;
    value = item.value;
    onchange?.(item.value);
  }

  function roving(node: HTMLElement) {
    return rovingFocus(node, { selector: '.ca-seg__item', orientation: 'horizontal' });
  }

  // Content sizing: segments have different widths, so the thumb is placed from the active
  // segment's measured offset and width (layout coordinates: unaffected by the scroll position).
  let root = $state<HTMLElement>();
  let thumbLeft = $state(0);
  let thumbWidth = $state(0);

  function measure() {
    const el = root?.querySelectorAll<HTMLElement>('.ca-seg__item')[index];
    if (!el) return;
    // Fractional, not offsetLeft/offsetWidth: those round, and a 47.5px segment got a 48px thumb (#1013).
    const box = el.getBoundingClientRect();
    const track = root!.getBoundingClientRect();
    thumbLeft = box.left - track.left - root!.clientLeft + root!.scrollLeft;
    thumbWidth = box.width;
  }

  /**
   * Content sizing: bring the selected segment into the track when it is scrolled out (a long last
   * option selected at mount, or picked from outside), without moving the page (#1051).
   */
  function reveal() {
    const node = root;
    const el = node?.querySelectorAll<HTMLElement>('.ca-seg__item')[index];
    if (!node || !el || node.scrollWidth <= node.clientWidth) return;
    const box = el.getBoundingClientRect();
    const track = node.getBoundingClientRect();
    const pad = Number.parseFloat(getComputedStyle(node).paddingInlineStart) || 0;
    const left = track.left + node.clientLeft + pad;
    const right = track.left + node.clientLeft + node.clientWidth - pad;
    if (box.left < left) node.scrollLeft -= left - box.left;
    else if (box.right > right) node.scrollLeft += box.right - right;
  }

  // Re-measure on selection, label/item changes, any size change of the track or a segment
  // (container resize, locale change that lengthens labels) and once web fonts have loaded.
  $effect(() => {
    if (sizing !== 'content' || !root) return;
    void index;
    void items;
    const node = root;
    measure();
    tick().then(() => {
      measure();
      reveal();
    });
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    for (const item of node.querySelectorAll('.ca-seg__item')) ro.observe(item);
    let live = true;
    document.fonts?.ready.then(() => {
      if (!live) return;
      measure();
      reveal();
    });
    return () => {
      live = false;
      ro.disconnect();
    };
  });

  // Equal columns shrink and cut a long label with an ellipsis: that label carries its full text
  // as `title`, so a pointer can still read it; one that fits gets none (#1051).
  let cut = $state<ReadonlySet<string>>(new Set());
  $effect(() => {
    if (sizing === 'content' || !root) return;
    void items;
    const node = root;
    const check = () => {
      const next = new Set<string>();
      node.querySelectorAll<HTMLElement>('.ca-seg__item').forEach((el, i) => {
        if (el.scrollWidth > el.clientWidth && items[i]) next.add(items[i].value);
      });
      // Untracked: the effect re-runs on items and size, not on its own result.
      const prev = untrack(() => cut);
      if (next.size !== prev.size || [...next].some((v) => !prev.has(v))) cut = next;
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(node);
    let live = true;
    document.fonts?.ready.then(() => live && check());
    return () => {
      live = false;
      ro.disconnect();
    };
  });

  // Overflowing content track: shift + wheel scrolls it sideways; a plain vertical wheel is left
  // alone so the page keeps scrolling. A horizontal wheel/trackpad delta scrolls natively.
  function wheel(node: HTMLElement) {
    if (sizing !== 'content') return;
    const onwheel = (e: WheelEvent) => {
      if (node.scrollWidth <= node.clientWidth) return;
      if (e.shiftKey && e.deltaX === 0 && e.deltaY !== 0) {
        e.preventDefault();
        node.scrollLeft += e.deltaY;
      } else if (e.deltaX !== 0 && !e.defaultPrevented && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Synthetic and some pointer-device events do not scroll by themselves.
        node.scrollLeft += e.deltaX;
      }
    };
    node.addEventListener('wheel', onwheel, { passive: false });
    return () => node.removeEventListener('wheel', onwheel);
  }
</script>

<div
  role="group"
  aria-label={ariaLabel}
  data-orientation="horizontal"
  data-disabled={disabled ? '' : undefined}
  class="ca-seg ca-seg--{size} {className}"
  data-no-motion={reducedMotion.value ? '' : undefined}
  style="--seg-count:{items.length};--seg-index:{Math.max(index, 0)}{sizing === 'content'
    ? `;--seg-left:${thumbLeft}px;--seg-width:${thumbWidth}px`
    : ''}"
  data-fullwidth={fullWidth ? '' : undefined}
  data-sizing={sizing === 'content' ? 'content' : undefined}
  bind:this={root}
  {@attach roving}
  {@attach wheel}
>
  {#if index >= 0}<span class="ca-seg__thumb" aria-hidden="true"></span>{/if}
  {#each items as item (item.value)}
    {@const on = item.value === value}
    {@const off = disabled || !!item.disabled}
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={item['aria-label']}
      title={item.label && cut.has(item.value) ? item.label : undefined}
      disabled={off}
      data-state={on ? 'on' : 'off'}
      data-disabled={off ? '' : undefined}
      data-orientation="horizontal"
      class="ca-seg__item"
      onclick={() => select(item)}
    >
      {#if item.icon}
        {@const Icon = item.icon}
        <Icon size={size === 'sm' ? 14 : 16} stroke-width={2} />
      {/if}
      {#if item.label}<span>{item.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-seg) {
      --seg-pad: var(--ca-space-0-5);
      position: relative;
      display: inline-grid;
      grid-auto-flow: column;
      /* Equal columns that may shrink: in a narrow slot labels truncate instead of the
         control pushing past its container. */
      grid-auto-columns: minmax(0, 1fr);
      column-gap: var(--ca-seg-gap, 0px);
      max-width: 100%;
      padding: var(--seg-pad);
      border-radius: var(--ca-radius-control);
      background: var(--ca-surface-raised);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      font-family: var(--ca-font-sans);
      isolation: isolate;
    }

    :global(.ca-seg[data-fullwidth]) {
      display: grid;
      width: 100%;
    }

    /* Content sizing: each segment is as wide as its label (never shrunk, so no truncation). A
       track wider than its container scrolls sideways with a hidden scrollbar; the vertical
       gesture still scrolls the page. */
    :global(.ca-seg[data-sizing='content']) {
      grid-auto-columns: max-content;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
    }

    :global(.ca-seg[data-sizing='content']::-webkit-scrollbar) {
      display: none;
    }

    :global(.ca-seg[data-sizing='content'] .ca-seg__item) {
      overflow: visible;
    }

    /* Thumb: one column wide, moved by whole-column steps (100% of its own width per index).
       With a gap the step is one column plus one gap. */
    :global(.ca-seg__thumb) {
      position: absolute;
      z-index: 0;
      top: var(--seg-pad);
      bottom: var(--seg-pad);
      left: var(--seg-pad);
      width: calc((100% - 2 * var(--seg-pad) - (var(--seg-count) - 1) * var(--ca-seg-gap, 0px)) / var(--seg-count));
      border-radius: calc(var(--ca-radius-control) - var(--ca-space-0-5));
      background: var(--ca-surface-overlay);
      box-shadow:
        var(--ca-shadow-sm),
        0 0 0 var(--ca-border-width) var(--ca-state-indicator);
      transform: translateX(calc(var(--seg-index) * (100% + var(--ca-seg-gap, 0px))));
      transition: transform var(--ca-duration-base) var(--ca-ease-spring);
      pointer-events: none;
    }

    /* Content sizing: the thumb sits on the measured segment (offset and width, set by script). */
    :global(.ca-seg[data-sizing='content'] .ca-seg__thumb) {
      left: 0;
      width: var(--seg-width);
      transform: translateX(var(--seg-left));
      transition:
        transform var(--ca-duration-base) var(--ca-ease-spring),
        width var(--ca-duration-base) var(--ca-ease-spring);
    }

    :global(.ca-seg[data-no-motion] .ca-seg__thumb),
    :global(.ca-seg[data-no-motion][data-sizing='content'] .ca-seg__thumb) {
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      :global(.ca-seg__thumb),
      :global(.ca-seg[data-sizing='content'] .ca-seg__thumb) {
        transition: none;
      }
    }

    :global(.ca-seg__item) {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1-5);
      border: none;
      border-radius: calc(var(--ca-radius-control) - var(--ca-space-0-5));
      background: transparent;
      color: var(--ca-text-secondary);
      font-family: inherit;
      font-weight: var(--ca-font-weight-medium);
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    /* Item tokens: --ca-seg-<sm|md>-item-* (one size) beat --ca-seg-item-* (both); unset, the sizes below. */
    :global(.ca-seg--sm .ca-seg__item) {
      height: calc(var(--ca-space-6) + var(--ca-space-0-5));
      padding: 0 var(--ca-seg-sm-item-padding-x, var(--ca-seg-item-padding-x, var(--ca-space-3)));
      font-size: var(--ca-seg-sm-item-font-size, var(--ca-seg-item-font-size, var(--ca-font-size-caption)));
      line-height: var(--ca-seg-sm-item-line-height, var(--ca-seg-item-line-height, inherit));
    }

    :global(.ca-seg--md .ca-seg__item) {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-seg-md-item-padding-x, var(--ca-seg-item-padding-x, var(--ca-space-4)));
      font-size: var(--ca-seg-md-item-font-size, var(--ca-seg-item-font-size, var(--ca-font-size-body2)));
      line-height: var(--ca-seg-md-item-line-height, var(--ca-seg-item-line-height, inherit));
    }

    :global(.ca-seg__item:hover:not([disabled])) {
      color: var(--ca-text-primary);
    }

    :global(.ca-seg__item[data-state='on']) {
      color: var(--ca-brand-text);
    }

    :global(.ca-seg__item:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    :global(.ca-seg__item[disabled]),
    :global(.ca-seg__item[disabled][data-state='on']) {
      cursor: not-allowed;
      color: var(--ca-text-disabled);
    }

    @media (pointer: coarse) {
      :global(.ca-seg__item) {
        min-height: var(--ca-touch-target);
        min-width: var(--ca-touch-target);
      }
    }
}
</style>

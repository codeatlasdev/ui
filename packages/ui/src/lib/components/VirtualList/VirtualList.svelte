<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { onDestroy, tick, untrack } from 'svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';
  const t = useT();

  /**
   * VirtualList: a windowed list for long histories, with infinite "load older" at the TOP.
   *
   * - Windowing: only the rows in view (plus `overscan`) are in the DOM. Row heights are measured
   *   with a `ResizeObserver` and cached by key; until measured a row counts as `estimateSize`.
   * - History: scrolling within `loadThreshold` px of the top (or pressing the visible
   *   "Load older messages" button) calls `onloadmore`. When older rows are prepended the
   *   scroll position is anchored to the row the user was looking at, so nothing jumps.
   * - Tail: stays pinned to the newest row while the user is at the bottom (`follow`), like
   *   `LiveList`. Scrolling up pauses it.
   * - Screen readers: the scroller is a named, focusable region around a real list; every row
   *   carries `aria-setsize` / `aria-posinset`. Appended rows are announced politely as one
   *   batched count, never per row; prepended history is silent.
   *
   * Usage:
   *   <VirtualList items={messages} getKey={(m) => m.id} label="Messages" {hasMore} {loadingMore} onloadmore={loadOlder}>
   *     {#snippet item(m)}<Bubble {...m} />{/snippet}
   *   </VirtualList>
   */
  interface Props {
    /** Rows, oldest first. Prepend older history to it; append new messages to it. */
    items: readonly T[];
    /** One row. Rendered inside an `<li>`. */
    item: Snippet<[T, number]>;
    /** Stable key per row. Required: it anchors the scroll position when rows are prepended. */
    getKey: (item: T, index: number) => string | number;
    /** Height in px assumed for a row until it has been measured. */
    estimateSize?: number;
    /** Rows rendered beyond the viewport on each side. */
    overscan?: number;
    /** Height of the scrolling area (any CSS length). */
    height?: string;
    /** Accessible name of the scrolling region (required). */
    label: string;
    /** Stay pinned to the newest row while the user is at the bottom. */
    follow?: boolean;
    /** Older rows exist. Shows the "Load older" button and enables scroll-triggered loading. */
    hasMore?: boolean;
    /** Older rows are being fetched. Suppresses further `onloadmore` calls. */
    loadingMore?: boolean;
    /** Distance from the top, in px, that triggers `onloadmore`. */
    loadThreshold?: number;
    /** Fetch older rows. */
    onloadmore?: () => void | Promise<void>;
    /** Shown while there are no rows. */
    empty?: Snippet;
    class?: string;
  }

  let {
    items,
    item,
    getKey,
    estimateSize = 56,
    overscan = 6,
    height = '24rem',
    label,
    follow = true,
    hasMore = false,
    loadingMore = false,
    loadThreshold = 120,
    onloadmore,
    empty,
    class: className = '',
  }: Props = $props();

  /** Distance from the bottom, in px, that still counts as "at the bottom". */
  const STICK = 24;

  let scroller = $state<HTMLElement | null>(null);
  let scrollTop = $state(0);
  let viewport = $state(0);
  /** Bumped whenever a measured size changes, so offsets recompute. */
  let sizeVersion = $state(0);
  let atBottom = true;

  /** Measured heights by key. Not reactive on purpose: `sizeVersion` signals changes. */
  const sizes = new Map<string | number, number>();
  const observed = new Map<Element, string | number>();

  const keys = $derived(items.map((it, i) => getKey(it, i)));

  /** `offsets[i]` is the top of row i; `offsets[n]` the total height. */
  const offsets = $derived.by(() => {
    sizeVersion;
    const out = new Array<number>(keys.length + 1);
    let y = 0;
    for (let i = 0; i < keys.length; i++) {
      out[i] = y;
      y += sizes.get(keys[i]) ?? estimateSize;
    }
    out[keys.length] = y;
    return out;
  });
  const total = $derived(offsets[offsets.length - 1] ?? 0);

  /** Index of the row containing `y` (last row whose top is <= y). */
  function indexAt(y: number, o: number[]) {
    let lo = 0;
    let hi = o.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (o[mid] <= y) lo = mid;
      else hi = mid - 1;
    }
    return Math.max(lo, 0);
  }

  const range = $derived.by(() => {
    const n = keys.length;
    if (n === 0) return { start: 0, end: 0 };
    // Before the first measure the viewport is unknown: render a screenful of estimates.
    const vh = viewport || 600;
    const first = indexAt(scrollTop, offsets);
    const last = indexAt(scrollTop + vh, offsets);
    return {
      start: Math.max(0, first - overscan),
      end: Math.min(n, last + 1 + overscan),
    };
  });

  const rows = $derived(
    Array.from({ length: range.end - range.start }, (_, j) => {
      const i = range.start + j;
      return { i, key: keys[i], it: items[i], top: offsets[i] };
    })
  );

  // One observer for all rows; sizes are cached by key. Layout-affecting work is flushed in a
  // frame of its own so the observer callback never changes layout (no "loop" errors).
  let ro: ResizeObserver | undefined;
  let flushing = false;
  function flush() {
    if (flushing) return;
    flushing = true;
    requestAnimationFrame(() => {
      flushing = false;
      anchorBefore();
      sizeVersion++;
      void restoreAnchor();
    });
  }
  function observer() {
    return (ro ??= new ResizeObserver((entries) => {
      let changed = false;
      for (const e of entries) {
        const key = observed.get(e.target);
        if (key === undefined) continue;
        const h = Math.round((e.borderBoxSize?.[0]?.blockSize ?? e.target.getBoundingClientRect().height) * 100) / 100;
        if (h > 0 && sizes.get(key) !== h) {
          sizes.set(key, h);
          changed = true;
        }
      }
      if (changed) flush();
    }));
  }

  function measure(el: HTMLElement, key: string | number) {
    observed.set(el, key);
    observer().observe(el);
    const h = el.getBoundingClientRect().height;
    if (h > 0 && sizes.get(key) !== h) {
      sizes.set(key, h);
    }
    return () => {
      observer().unobserve(el);
      observed.delete(el);
    };
  }

  // Anchor: the first row at/after the viewport top and its distance from it. Restoring it after
  // any layout change above (prepend, a row above re-measuring) keeps the content still.
  let anchor: { key: string | number; delta: number } | null = null;
  let restoring = false;

  function anchorBefore() {
    if (!scroller || restoring || keys.length === 0) return;
    // Read the DOM, not `scrollTop` state: a scroll event may not have been delivered yet.
    const top = scroller.scrollTop;
    const i = indexAt(top, offsets);
    anchor = { key: keys[i], delta: offsets[i] - top };
  }

  async function restoreAnchor() {
    if (!anchor || !scroller) return;
    const wanted = anchor;
    restoring = true;
    await tick();
    if (scroller) {
      const i = keys.indexOf(wanted.key);
      if (i >= 0 && !(follow && atBottom)) {
        const next = offsets[i] - wanted.delta;
        if (Math.abs(next - scroller.scrollTop) > 0.5) scroller.scrollTop = next;
      }
      scrollTop = scroller.scrollTop;
    }
    restoring = false;
    anchor = null;
  }

  function nearBottom() {
    return !!scroller && scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= STICK;
  }

  /** Where WE last put the scroll position; a scroll event at any other offset is the user. */
  let pinnedAt = -1;

  function onscroll() {
    if (!scroller) return;
    scrollTop = scroller.scrollTop;
    if (Math.abs(scroller.scrollTop - pinnedAt) > 1) atBottom = nearBottom();
    maybeLoad();
  }

  function maybeLoad() {
    if (!scroller || !hasMore || loadingMore || !onloadmore) return;
    if (scroller.scrollTop <= loadThreshold) requestMore();
  }

  /** One call per page: re-armed when `loadingMore` ends or the items change. */
  let requested = false;
  function requestMore() {
    if (requested || !onloadmore) return;
    requested = true;
    void onloadmore();
  }

  /** Pin to the tail, unless the user has scrolled away since the pin was queued. */
  function pin() {
    if (!scroller || !atBottom || !follow) return;
    // The user may have scrolled since `atBottom` was last computed: trust the DOM.
    if (pinnedAt >= 0 && Math.abs(scroller.scrollTop - pinnedAt) > 1 && !nearBottom()) {
      atBottom = false;
      return;
    }
    scroller.scrollTop = scroller.scrollHeight;
    pinnedAt = scroller.scrollTop;
    scrollTop = pinnedAt;
  }

  // Track the viewport height.
  $effect(() => {
    const el = scroller;
    if (!el) return;
    viewport = el.clientHeight;
    const vo = new ResizeObserver(() => {
      viewport = el.clientHeight;
    });
    vo.observe(el);
    return () => vo.disconnect();
  });

  // Initial scroll: the bottom (newest), once the first rows are measured.
  let started = false;
  $effect(() => {
    if (started || !scroller || keys.length === 0) return;
    started = true;
    queueMicrotask(pin);
    requestAnimationFrame(pin);
  });

  // Items changed: detect prepend (previous first key now at k > 0) and append, before paint.
  let prevKeys: (string | number)[] = untrack(() => keys.slice());
  let prevOffsets: number[] = untrack(() => offsets.slice());
  let announced = untrack(() => keys.length);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingAppended = 0;

  $effect.pre(() => {
    const next = keys;
    const nextOffsets = offsets;
    untrack(() => {
      const before = prevKeys;
      const beforeOffsets = prevOffsets;
      prevKeys = next.slice();
      prevOffsets = nextOffsets.slice();
      if (before.length === 0 || next.length === 0 || before === next) return;

      const k = next.indexOf(before[0]);
      const prepended = k > 0 ? k : 0;
      const appended = Math.max(0, next.length - prepended - before.length);

      if (prepended > 0 && scroller) {
        // The row that was first is now at `k`: shift by how far it moved down.
        const shift = nextOffsets[k] - beforeOffsets[0];
        if (shift !== 0) {
          const target = scroller.scrollTop + shift;
          scroller.scrollTop = target;
          scrollTop = target;
        }
        // Rows above are estimates until measured: re-anchor once they are.
        anchorBefore();
        requestAnimationFrame(() => void restoreAnchor());
      }

      if (appended > 0) {
        queueMicrotask(pin);
        requestAnimationFrame(pin);
        pendingAppended += appended;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const n = pendingAppended;
          pendingAppended = 0;
          announced = next.length;
          if (n > 0) announce(t().virtualList.items(n));
        }, 600);
      }
    });
  });

  // A page finished (loadingMore ended, or rows arrived): re-arm, and ask again if the user is
  // still at the top. Skipped on mount so nothing loads before the user gets near the top.
  let rearmed = false;
  $effect(() => {
    const busy = loadingMore;
    items.length;
    if (busy) return;
    untrack(() => {
      requested = false;
      if (!rearmed) {
        rearmed = true;
        return;
      }
      requestAnimationFrame(() => maybeLoad());
    });
  });

  // Keep the pinned tail pinned when a measured size changes at the bottom.
  $effect(() => {
    sizeVersion;
    total;
    untrack(() => {
      if (started) queueMicrotask(pin);
    });
  });

  function loadOlder() {
    requested = false;
    requestMore();
  }

  onDestroy(() => {
    clearTimeout(timer);
    ro?.disconnect();
  });
</script>

<div class="ca-virtual-list {className}" style="--ca-virtual-list-h:{height}">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={scroller}
    class="ca-virtual-list__scroller"
    role="region"
    aria-label={label}
    tabindex="0"
    {onscroll}
  >
    {#if hasMore || loadingMore}
      <div class="ca-virtual-list__head">
        {#if loadingMore}
          <p class="ca-virtual-list__loading" aria-busy="true">{t().virtualList.loadingOlder}</p>
        {:else}
          <button type="button" class="ca-virtual-list__older" onclick={loadOlder}>
            {t().virtualList.loadOlder}
          </button>
        {/if}
      </div>
    {/if}

    {#if items.length === 0}
      <div class="ca-virtual-list__empty">{@render empty?.()}</div>
    {:else}
      <ul class="ca-virtual-list__list" style="block-size:{total}px">
        {#each rows as row (row.key)}
          <li
            class="ca-virtual-list__item"
            style="transform:translateY({row.top}px)"
            aria-setsize={items.length}
            aria-posinset={row.i + 1}
            {@attach (el) => measure(el, row.key)}
          >
            {@render item(row.it, row.i)}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-virtual-list {
      min-width: 0;
    }

    .ca-virtual-list__scroller {
      position: relative;
      height: var(--ca-virtual-list-h);
      overflow-y: auto;
      overscroll-behavior: contain;
      /* Anchoring is done by hand (keyed): the browser heuristic fights absolute rows. */
      overflow-anchor: none;
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-lg);
    }
    .ca-virtual-list__scroller:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: 2px;
    }

    /* Zero layout height: the control floats over the first rows, so list offsets stay equal to scroll offsets. */
    .ca-virtual-list__head {
      position: sticky;
      inset-block-start: 0;
      z-index: 1;
      block-size: 0;
      display: flex;
      justify-content: center;
      padding-block-start: var(--ca-space-2);
      pointer-events: none;
    }
    .ca-virtual-list__head > * { pointer-events: auto; }

    .ca-virtual-list__older {
      min-block-size: var(--ca-touch-target);
      padding: var(--ca-space-1-5) var(--ca-space-4);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      font: inherit;
      font-size: var(--ca-font-size-caption);
      cursor: pointer;
    }
    .ca-virtual-list__older:hover { background: var(--ca-action-hover); }
    .ca-virtual-list__older:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: 2px;
    }

    .ca-virtual-list__loading {
      margin: 0;
      padding: var(--ca-space-1-5) var(--ca-space-3);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-surface-raised);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-caption);
    }

    .ca-virtual-list__list {
      position: relative;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .ca-virtual-list__item {
      position: absolute;
      inset-block-start: 0;
      inset-inline: 0;
      contain: layout style;
    }

    .ca-virtual-list__empty {
      display: grid;
      place-items: center;
      min-block-size: 100%;
      padding: var(--ca-space-6);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-body2);
    }

    @media (forced-colors: active) {
      .ca-virtual-list__older { border: 1px solid CanvasText; }
    }
}
</style>

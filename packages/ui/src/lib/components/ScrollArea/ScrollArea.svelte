<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'hover' | 'scroll' | 'auto' | 'always';
    orientation?: 'vertical' | 'horizontal' | 'both';
    maxHeight?: string;
    maxWidth?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    type = 'hover',
    orientation = 'vertical',
    maxHeight,
    maxWidth,
    class: className = '',
    children,
  }: Props = $props();

  const HIDE_DELAY = 600;
  const MIN_THUMB = 18;

  let style = $derived(
    [maxHeight && `max-height:${maxHeight}`, maxWidth && `max-width:${maxWidth}`]
      .filter(Boolean)
      .join(';')
  );

  const showV = $derived(orientation === 'vertical' || orientation === 'both');
  const showH = $derived(orientation === 'horizontal' || orientation === 'both');

  let viewport = $state<HTMLElement>();
  let content = $state<HTMLElement>();
  let trackV = $state<HTMLElement>();
  let trackH = $state<HTMLElement>();

  // Geometry mirrored from the native scroll container.
  let m = $state({ sw: 0, sh: 0, cw: 0, ch: 0, left: 0, top: 0 });
  let hovering = $state(false);
  let scrolling = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function measure() {
    if (!viewport) return;
    m = {
      sw: viewport.scrollWidth,
      sh: viewport.scrollHeight,
      cw: viewport.clientWidth,
      ch: viewport.clientHeight,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
  }

  $effect(() => {
    const vp = viewport;
    if (!vp) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    if (content) ro.observe(content);
    return () => ro.disconnect();
  });

  function onscroll() {
    measure();
    scrolling = true;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => (scrolling = false), HIDE_DELAY);
  }

  $effect(() => () => clearTimeout(hideTimer));

  const overflowV = $derived(m.sh > m.ch);
  const overflowH = $derived(m.sw > m.cw);

  function visible(overflow: boolean): boolean {
    switch (type) {
      case 'always':
        return true;
      case 'auto':
        return overflow;
      case 'hover':
        return hovering;
      case 'scroll':
        return scrolling || hovering;
    }
  }

  // Thumb length / offset along one axis, in px of the track.
  function thumb(content: number, view: number, scroll: number, track: number) {
    const ratio = content > 0 ? view / content : 1;
    const size = Math.max(track * ratio, MIN_THUMB);
    const max = content - view;
    const offset = max > 0 ? (scroll / max) * (track - size) : 0;
    return { size, offset };
  }

  // The opposite scrollbar's thickness leaves a corner so the two tracks never overlap.
  const cornerW = $derived(showV && showH ? (trackV?.offsetWidth ?? 0) : 0);
  const cornerH = $derived(showV && showH ? (trackH?.offsetHeight ?? 0) : 0);

  const trackLenV = $derived(trackV?.clientHeight ?? 0);
  const trackLenH = $derived(trackH?.clientWidth ?? 0);
  const thumbV = $derived(thumb(m.sh, m.ch, m.top, trackLenV));
  const thumbH = $derived(thumb(m.sw, m.cw, m.left, trackLenH));

  // Dragging a thumb, or clicking the track, scrolls the native viewport.
  function startDrag(e: PointerEvent, axis: 'v' | 'h') {
    if (!viewport || e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    const vertical = axis === 'v';
    const start = vertical ? e.clientY : e.clientX;
    const startScroll = vertical ? viewport.scrollTop : viewport.scrollLeft;
    const t = vertical ? thumbV : thumbH;
    const track = vertical ? trackLenV : trackLenH;
    const ratio = (vertical ? m.sh - m.ch : m.sw - m.cw) / Math.max(track - t.size, 1);
    target.setPointerCapture(e.pointerId);
    e.stopPropagation();
    const move = (ev: PointerEvent) => {
      if (!viewport) return;
      const delta = ((vertical ? ev.clientY : ev.clientX) - start) * ratio;
      if (vertical) viewport.scrollTop = startScroll + delta;
      else viewport.scrollLeft = startScroll + delta;
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }

  function trackClick(e: PointerEvent, axis: 'v' | 'h') {
    if (!viewport || e.target !== e.currentTarget || e.button !== 0) return;
    const track = e.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const vertical = axis === 'v';
    const pos = vertical ? e.clientY - rect.top : e.clientX - rect.left;
    const t = vertical ? thumbV : thumbH;
    const len = vertical ? trackLenV : trackLenH;
    const max = vertical ? m.sh - m.ch : m.sw - m.cw;
    const next = ((pos - t.size / 2) / Math.max(len - t.size, 1)) * max;
    if (vertical) viewport.scrollTop = next;
    else viewport.scrollLeft = next;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="ca-scroll-area {className}"
  data-scroll-area-root=""
  {style}
  onpointerenter={() => (hovering = true)}
  onpointerleave={() => (hovering = false)}
>
  <!-- Always a scroll region: focusable so keyboard users can scroll it (axe scrollable-region-focusable). -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={viewport}
    class="ca-scroll-area__viewport"
    data-scroll-area-viewport=""
    tabindex="0"
    style:overflow-x={showH ? 'scroll' : 'hidden'}
    style:overflow-y={showV ? 'scroll' : 'hidden'}
    {onscroll}
  >
    <div bind:this={content} data-scroll-area-content="" style:min-width={showH ? 'fit-content' : undefined}>
      {@render children?.()}
    </div>
  </div>

  {#if showV}
    <!-- Decorative: the native scroll region above stays the accessible control. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={trackV}
      class="ca-scroll-area__scrollbar ca-scroll-area__scrollbar--v"
      data-scroll-area-scrollbar=""
      data-orientation="vertical"
      data-state={visible(overflowV) ? 'visible' : 'hidden'}
      style:bottom="{cornerH}px"
      aria-hidden="true"
      onpointerdown={(e) => trackClick(e, 'v')}
    >
      <div
        class="ca-scroll-area__thumb"
        data-scroll-area-thumb=""
        data-state={overflowV ? 'visible' : 'hidden'}
        style:height="{thumbV.size}px"
        style:transform="translate3d(0, {thumbV.offset}px, 0)"
        onpointerdown={(e) => startDrag(e, 'v')}
      ></div>
    </div>
  {/if}

  {#if showH}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={trackH}
      class="ca-scroll-area__scrollbar ca-scroll-area__scrollbar--h"
      data-scroll-area-scrollbar=""
      data-orientation="horizontal"
      data-state={visible(overflowH) ? 'visible' : 'hidden'}
      style:right="{cornerW}px"
      aria-hidden="true"
      onpointerdown={(e) => trackClick(e, 'h')}
    >
      <div
        class="ca-scroll-area__thumb"
        data-scroll-area-thumb=""
        data-state={overflowH ? 'visible' : 'hidden'}
        style:width="{thumbH.size}px"
        style:transform="translate3d({thumbH.offset}px, 0, 0)"
        onpointerdown={(e) => startDrag(e, 'h')}
      ></div>
    </div>
  {/if}
</div>

<style>
  :global(.ca-scroll-area) {
    position: relative;
    overflow: hidden;
  }

  /* max-height/-width inherit from the root: height:100% against an auto-height
     root resolves to auto, which would clip the content instead of scrolling it. */
  :global(.ca-scroll-area__viewport) {
    width: 100%;
    height: 100%;
    max-height: inherit;
    max-width: inherit;
    overflow: scroll;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  :global(.ca-scroll-area__viewport > [data-scroll-area-content]) {
    flex-grow: 1;
  }

  :global(.ca-scroll-area__viewport::-webkit-scrollbar) {
    display: none;
  }

  :global(.ca-scroll-area__scrollbar) {
    position: absolute;
    display: flex;
    user-select: none;
    touch-action: none;
    padding: var(--ca-space-0-5);
    background: transparent;
    transition: background var(--ca-duration-fast) var(--ca-ease-decelerate);
  }

  :global(.ca-scroll-area__scrollbar[data-state='hidden']) {
    display: none;
  }

  :global(.ca-scroll-area__scrollbar--v) {
    top: 0;
    right: 0;
    width: var(--ca-space-2);
    flex-direction: column;
  }

  :global(.ca-scroll-area__scrollbar--h) {
    bottom: 0;
    left: 0;
    height: var(--ca-space-2);
    flex-direction: row;
  }

  :global(.ca-scroll-area__scrollbar:hover) {
    background: var(--ca-glass-tint-regular);
  }

  :global(.ca-scroll-area__thumb) {
    flex: none;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-outline-default);
    position: relative;
    cursor: pointer;
  }

  :global(.ca-scroll-area__scrollbar--v .ca-scroll-area__thumb) {
    width: 100%;
  }

  :global(.ca-scroll-area__scrollbar--h .ca-scroll-area__thumb) {
    height: 100%;
  }

  :global(.ca-scroll-area__thumb:hover) {
    background: var(--ca-text-hint);
  }
</style>

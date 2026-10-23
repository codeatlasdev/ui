<script lang="ts">
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { pageFrame } from '../../i18n/groups/pageFrame.js';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { stageInsets } from '../../stores/stage-insets.svelte.js';
  import { provideSectionHeadingLevel } from '../PageShell/heading-context.js';

  /**
   * PageFrame: the page container for a map-first app, where a live stage (map, canvas) sits
   * behind the content. It lays the page out over the stage and reports what it covers.
   *
   *   mode="map"    desktop: a floating panel (`side`, `width`), the stage stays interactive around it.
   *                 mobile: full screen, or with `sheet` a non-modal bottom sheet with detents.
   *   mode="split"  desktop: a wide work area (~60%) plus a stage strip. mobile: full screen,
   *                 or the stage alone with `mobileStage`.
   *   mode="page"   an opaque full page; the stage is hidden (`data-ca-stage="hidden"` on <html>).
   *
   * `header`, `toolbar` and `footer` stay fixed; only the body scrolls. The covered rectangle is
   * published on `stageInsets` (and `--ca-stage-inset-*`) so the stage can keep content clear of it.
   *
   *   <PageFrame mode="map" side="left" width="md" sheet label="Territory">
   *     {#snippet header()}<h2>Territory</h2>{/snippet}
   *     …
   *   </PageFrame>
   */
  type Detent = 'peek' | 'half' | 'full';

  interface Props {
    /** `map` (default): floating panel. `split`: work area plus stage strip. `page`: opaque full page, stage hidden. */
    mode?: 'map' | 'split' | 'page';
    /** Which edge the panel (or the split's work area) sits on. */
    side?: 'left' | 'right';
    /** Panel width on desktop: `sm` 352px, `md` 416px, `lg` 544px, `xl` 704px. Ignored by `split` and `page`. */
    width?: 'sm' | 'md' | 'lg' | 'xl';
    /** Below 900px, `mode="map"` becomes a non-modal bottom sheet (no backdrop, no focus trap, the stage above stays interactive) instead of a full-screen layer. */
    sheet?: boolean;
    /** Sheet height step: `peek` (header only), `half` (~45% of the area, the default) or `full`. Bindable; dragging or the handle's arrow keys change it. */
    detent?: Detent;
    /** `mode="split"` below 900px: show the stage instead of the work area. */
    mobileStage?: boolean;
    /** Pads the body. Turn off for full-bleed tables and maps. */
    padded?: boolean;
    /** Draws a separator under the header. */
    headerBorder?: boolean;
    /** Publish the covered rectangle on `stageInsets`. Turn off for a frame that is not over the stage. */
    publishInsets?: boolean;
    /** Accessible name of the panel (it is a `region`). */
    label?: string;
    /** Title, description and actions. */
    header?: Snippet;
    /** Fixed row under the header: search, filters, tabs. */
    toolbar?: Snippet;
    /** Fixed row at the bottom: primary actions. */
    footer?: Snippet;
    class?: string;
    /** Scrolling body. */
    children?: Snippet;
  }

  let {
    mode = 'map',
    side = 'left',
    width = 'md',
    sheet = false,
    detent = $bindable('half'),
    mobileStage = false,
    padded = true,
    headerBorder = false,
    publishInsets = true,
    label,
    header,
    toolbar,
    footer,
    class: className = '',
    children,
  }: Props = $props();

  const t = useMessages(pageFrame);
  // The shell owns the page <h1>; section titles inside a frame start at <h2>.
  provideSectionHeadingLevel();

  const DETENTS: Detent[] = ['peek', 'half', 'full'];
  const key = Symbol('page-frame');

  let root = $state<HTMLElement>();
  let panel = $state<HTMLElement>();
  let mobile = $state(false);

  // The same 900px the shell uses to swap rail for bottom navigation.
  $effect(() => {
    const mq = window.matchMedia('(max-width: 899.98px)');
    const sync = () => (mobile = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  const asSheet = $derived(mode === 'map' && sheet && mobile);
  const stageOnly = $derived(mode === 'split' && mobileStage && mobile);

  // mode="page" hides the stage (CSS visibility + inert on the stage wrapper, owned by the shell).
  $effect(() => {
    if (mode !== 'page') return;
    const html = document.documentElement;
    html.setAttribute('data-ca-stage', 'hidden');
    return () => html.removeAttribute('data-ca-stage');
  });

  // Covered rectangle: what the panel occupies, in px from each edge of the frame (the stage area).
  $effect(() => {
    if (!publishInsets || !root || !panel || stageOnly || mode === 'page') return;
    const el = panel;
    const area = root;
    const measure = () => {
      const a = area.getBoundingClientRect();
      const p = el.getBoundingClientRect();
      // Extent of the panel from each edge of the area; an edge counts only where the panel
      // touches (or sits within a frame gap of) it and is not spanning the whole axis.
      const spansX = p.width >= a.width - 1;
      const spansY = p.height >= a.height - 1;
      const fromTop = p.bottom - a.top;
      const fromBottom = a.bottom - p.top;
      const fromLeft = p.right - a.left;
      const fromRight = a.right - p.left;
      let next = { top: 0, right: 0, bottom: 0, left: 0 };
      if (spansX && spansY) next = { top: fromTop, right: fromRight, bottom: fromBottom, left: fromLeft };
      else if (spansX) next = asSheet || a.bottom - p.bottom < p.top - a.top ? { ...next, bottom: fromBottom } : { ...next, top: fromTop };
      else next = side === 'left' ? { ...next, left: fromLeft } : { ...next, right: fromRight };
      untrack(() => stageInsets.set(key, next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(area);
    return () => {
      ro.disconnect();
      stageInsets.clear(key);
    };
  });

  // ── Sheet detents: drag the handle, or Arrow/Home/End on it ──────────────────
  let dragging = $state(false);
  let dragHeight = $state<number | null>(null);
  let startY = 0;
  let startH = 0;
  const detentIndex = $derived(DETENTS.indexOf(detent));

  function heights(): Record<Detent, number> {
    const a = root?.getBoundingClientRect().height ?? 0;
    return { peek: Math.min(a, 112), half: a * 0.45, full: a };
  }

  function nearest(h: number): Detent {
    const all = heights();
    return DETENTS.reduce((best, d) => (Math.abs(all[d] - h) < Math.abs(all[best] - h) ? d : best), 'half' as Detent);
  }

  function onDown(e: PointerEvent) {
    if (!asSheet || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging = true;
    startY = e.clientY;
    startH = panel?.getBoundingClientRect().height ?? 0;
    dragHeight = startH;
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const max = root?.getBoundingClientRect().height ?? startH;
    dragHeight = Math.min(max, Math.max(heights().peek, startH + (startY - e.clientY)));
  }
  function onUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (dragHeight !== null) detent = nearest(dragHeight);
    dragHeight = null;
  }
  function onKey(e: KeyboardEvent) {
    const next =
      e.key === 'ArrowUp' ? Math.min(2, detentIndex + 1)
      : e.key === 'ArrowDown' ? Math.max(0, detentIndex - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 2
      : -1;
    if (next < 0) return;
    e.preventDefault();
    detent = DETENTS[next];
  }

  const labelText = $derived(label ?? t().pageFrame.panel);
  const sheetStyle = $derived(dragHeight !== null ? `--ca-frame-drag-h:${dragHeight}px` : undefined);
</script>

<div
  bind:this={root}
  class="ca-page-frame {className}"
  data-mode={mode}
  data-side={side}
  data-width={width}
  data-sheet={asSheet ? '' : undefined}
  data-detent={asSheet ? detent : undefined}
  data-dragging={dragging ? '' : undefined}
>
  <!-- The panel is a named region, not a dialog: the stage behind it keeps focus order and taps. -->
  <section
    bind:this={panel}
    class="ca-page-frame__panel ca-surface"
    data-elevation={mode === 'page' ? 0 : 4}
    data-material={mode === 'page' ? 'solid' : 'auto'}
    aria-label={labelText}
    hidden={stageOnly}
    style={sheetStyle}
  >
    {#if asSheet}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="ca-page-frame__handle"
        role="slider"
        tabindex="0"
        aria-label={t().pageFrame.resize}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={detentIndex}
        aria-valuetext={t().pageFrame[detent]}
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onkeydown={onKey}
      >
        <span class="ca-page-frame__grip" aria-hidden="true"></span>
      </div>
    {/if}
    {#if header}
      <div class="ca-page-frame__header" data-bordered={headerBorder ? '' : undefined}>
        {@render header()}
      </div>
    {/if}
    {#if toolbar}
      <div class="ca-page-frame__toolbar">{@render toolbar()}</div>
    {/if}
    <!-- Keyboard-scrollable while it overflows (scrollFocusable); named so the tab stop is announced. -->
    <div class="ca-page-frame__body" data-padded={padded ? '' : undefined} role="group" aria-label={labelText} use:scrollFocusable>
      {@render children?.()}
    </div>
    {#if footer}
      <div class="ca-page-frame__footer">{@render footer()}</div>
    {/if}
  </section>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* The frame is its own containing block and fills its parent (the shell's content area, a flex
       column) in normal flow, so it works anywhere. Only the panel takes pointer events: the stage
       around a floating panel stays interactive. */
    .ca-page-frame {
      --ca-frame-gap: var(--ca-space-3);
      position: relative;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
      z-index: var(--ca-z-sticky);
      pointer-events: none;
    }

    .ca-page-frame__panel {
      position: absolute;
      top: var(--ca-frame-gap);
      bottom: var(--ca-frame-gap);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      min-height: 0;
      overflow: hidden;
      pointer-events: auto;
      width: var(--ca-frame-w, 26rem);
      max-width: calc(100% - 2 * var(--ca-frame-gap));
    }
    .ca-page-frame__panel[hidden] { display: none; }

    .ca-page-frame[data-side='left'] .ca-page-frame__panel { left: var(--ca-frame-gap); }
    .ca-page-frame[data-side='right'] .ca-page-frame__panel { right: var(--ca-frame-gap); }

    .ca-page-frame[data-width='sm'] { --ca-frame-w: calc(var(--ca-space-unit) * 88); }
    .ca-page-frame[data-width='md'] { --ca-frame-w: calc(var(--ca-space-unit) * 104); }
    .ca-page-frame[data-width='lg'] { --ca-frame-w: calc(var(--ca-space-unit) * 136); }
    .ca-page-frame[data-width='xl'] { --ca-frame-w: calc(var(--ca-space-unit) * 176); }

    /* split: the work area takes 60%, flush to its edge; the rest is stage. */
    .ca-page-frame[data-mode='split'] .ca-page-frame__panel {
      --ca-frame-w: 60%;
      top: 0;
      bottom: 0;
      border-radius: 0;
    }
    .ca-page-frame[data-mode='split'][data-side='left'] .ca-page-frame__panel { left: 0; }
    .ca-page-frame[data-mode='split'][data-side='right'] .ca-page-frame__panel { right: 0; }

    /* page: opaque, edge to edge. */
    .ca-page-frame[data-mode='page'] { pointer-events: auto; }
    .ca-page-frame[data-mode='page'] .ca-page-frame__panel {
      inset: 0;
      width: 100%;
      max-width: none;
      border-radius: 0;
      background: var(--ca-bg-default, Canvas);
    }

    .ca-page-frame__header {
      flex-shrink: 0;
      padding: var(--ca-space-4) var(--ca-space-5) var(--ca-space-3);
    }
    .ca-page-frame__header[data-bordered] {
      box-shadow: inset 0 calc(-1 * var(--ca-border-width)) 0 var(--ca-outline-subtle);
    }
    .ca-page-frame__toolbar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      padding: var(--ca-space-2) var(--ca-space-5);
    }

    .ca-page-frame__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0;
    }
    .ca-page-frame__body[data-padded] {
      padding: var(--ca-space-2) var(--ca-space-5) var(--ca-space-5);
    }

    .ca-page-frame__footer {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      gap: var(--ca-space-2);
      padding: var(--ca-space-3) var(--ca-space-5);
      box-shadow: inset 0 var(--ca-border-width) 0 var(--ca-outline-subtle);
    }

    .ca-page-frame__handle {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      padding: var(--ca-space-2) 0 var(--ca-space-1);
      touch-action: none;
      cursor: grab;
      border-radius: var(--ca-radius-md);
    }
    .ca-page-frame__handle:focus-visible {
      outline: var(--ca-focus-ring-width, 2px) solid var(--ca-focus-ring-color, currentColor);
      outline-offset: -2px;
    }
    .ca-page-frame__grip {
      width: calc(var(--ca-space-unit) * 9);
      height: var(--ca-space-1);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-outline-default);
    }

    /* Mobile: full screen over the stage, or a non-modal bottom sheet. */
    @media (max-width: 899.98px) {
      .ca-page-frame__panel,
      .ca-page-frame[data-mode='split'] .ca-page-frame__panel {
        inset: 0;
        width: 100%;
        max-width: none;
        border-radius: 0;
      }

      .ca-page-frame[data-sheet] .ca-page-frame__panel {
        top: auto;
        height: var(--ca-frame-drag-h, 45%);
        border-radius: var(--ca-radius-xl) var(--ca-radius-xl) 0 0;
        padding-bottom: var(--ca-safe-bottom);
        transition: height var(--ca-duration-base) var(--ca-ease-standard);
      }
      .ca-page-frame[data-sheet][data-detent='peek'] .ca-page-frame__panel { height: var(--ca-frame-drag-h, calc(var(--ca-space-unit) * 28)); }
      .ca-page-frame[data-sheet][data-detent='full'] .ca-page-frame__panel { height: var(--ca-frame-drag-h, 100%); }
      .ca-page-frame[data-dragging] .ca-page-frame__panel { transition: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-page-frame__panel { transition: none !important; }
    }

    @media (forced-colors: active) {
      .ca-page-frame__panel { border: var(--ca-border-width) solid CanvasText; }
    }
}
</style>

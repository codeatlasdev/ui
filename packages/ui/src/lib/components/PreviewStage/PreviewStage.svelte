<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { previewStage } from '../../i18n/groups/previewStage.js';
  import { colorScheme } from '../../stores/color-scheme.svelte.js';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import SegmentedControl from '../ToggleGroup/SegmentedControl.svelte';
  import ThemeIsland from '../ThemeIsland/ThemeIsland.svelte';
  const t = useMessages(previewStage);

  /**
   * PreviewStage: a resizable device frame for showcasing a component or a whole page at a real
   * width. A width control (presets plus a draggable, keyboard-operable splitter) sets the width of
   * the frame in CSS pixels; the frame is centred in the stage and, when the stage is narrower than
   * the chosen width, scaled down as a whole (an iframe still lays the page out at the real width).
   *
   * Two modes:
   *   children  inline content, themed in its own `ThemeIsland` (`scheme`, `preset`), so a light/dark
   *             or preset switch never touches the page around the stage.
   *   src       a same-origin page in an `<iframe>`: isolated styles, real viewport width, real media
   *             queries. Use it for full pages (templates, auth, dashboards).
   *
   *   <PreviewStage label="Pricing" bind:width scheme="dark">
   *     <Pricing />
   *   </PreviewStage>
   *   <PreviewStage label="Dashboard" src="/templates/app/dashboard/" height={720} />
   */
  interface Props {
    /** Frame width in CSS px, or `'fill'` for the whole stage. Bindable. @default 'fill' */
    width?: number | 'fill';
    /** Width presets in px; `Fill` is always offered. @default [390, 768, 1280] */
    widths?: number[];
    /** Colour scheme of the content. `'inherit'` keeps the page's own. Bindable. @default 'inherit' */
    scheme?: 'light' | 'dark' | 'inherit';
    /** `data-preset` of the content. Omit to keep the page's preset. */
    preset?: string;
    /** Accessible name of the stage (what is shown). Required. */
    label: string;
    /** Same-origin URL of a page to show in an isolated `<iframe>`. Ignored when `children` is given. */
    src?: string;
    /** Stage height in px. With `src` the frame is exactly this tall at the chosen width. @default 560 */
    height?: number;
    /** Smallest width the splitter reaches, in px. @default 280 */
    minWidth?: number;
    /** Extra controls rendered in the toolbar, after the width control. */
    toolbar?: Snippet;
    class?: string;
    /** Inline content (instead of `src`). */
    children?: Snippet;
  }

  let {
    width = $bindable('fill'),
    widths = [390, 768, 1280],
    scheme = 'inherit',
    preset,
    label,
    src,
    height = 560,
    minWidth = 280,
    toolbar,
    class: className = '',
    children,
  }: Props = $props();

  let canvas = $state<HTMLElement>();
  let canvasWidth = $state(0);
  let dragging = $state(false);
  let loaded = $state(false);
  const splitId = $props.id();

  const items = $derived([
    ...widths.map((w) => ({ value: String(w), label: String(w) })),
    { value: 'fill', label: t().previewStage.fill },
  ]);
  // The frame is never wider than the stage unless it is scaled: `shown` is its layout width.
  const shown = $derived(width === 'fill' ? canvasWidth : width);
  const scale = $derived(canvasWidth > 0 && shown > canvasWidth ? canvasWidth / shown : 1);
  const max = $derived(Math.max(minWidth, widths.length ? Math.max(...widths) : canvasWidth));

  function pick(v: string) {
    width = v === 'fill' ? 'fill' : Number(v);
  }

  let startX = 0;
  let startW = 0;
  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer: the drag still tracks */
    }
    startX = e.clientX;
    startW = shown;
    dragging = true;
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    // The frame is centred: one edge moves half as far as the width changes.
    width = clamp(Math.round(startW + (e.clientX - startX) * 2));
  }
  function up(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  }
  const clamp = (n: number) => Math.min(Math.max(n, minWidth), max);

  function key(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = e.shiftKey ? 100 : 10;
    const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl';
    const inc = rtl ? 'ArrowLeft' : 'ArrowRight';
    const dec = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next: number;
    if (e.key === inc) next = shown + step;
    else if (e.key === dec) next = shown - step;
    else if (e.key === 'Home') next = minWidth;
    else if (e.key === 'End') next = max;
    else return;
    e.preventDefault();
    width = clamp(next);
  }

  onMount(() => {
    if (!canvas) return;
    canvasWidth = Math.floor(canvas.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => (canvasWidth = Math.floor(entry.contentRect.width)));
    ro.observe(canvas);
    return () => ro.disconnect();
  });

  const frameHeight = $derived(height);
  const scaled = $derived(scale < 1);
</script>

<div class="ca-pstage {className}" data-dragging={dragging ? '' : undefined} data-no-motion={reducedMotion.value ? '' : undefined}>
  <div class="ca-pstage__bar">
    <SegmentedControl
      size="sm"
      aria-label={t().previewStage.device}
      value={width === 'fill' ? 'fill' : String(width)}
      {items}
      onchange={pick}
    />
    <output class="ca-pstage__readout" aria-live="off">{t().previewStage.readout(Math.round(shown))}</output>
    {@render toolbar?.()}
  </div>

  <div class="ca-pstage__canvas" bind:this={canvas} style="--pstage-h:{frameHeight}px;--pstage-w:{shown}px;--pstage-scale:{scale}">
    <div class="ca-pstage__viewport" data-scaled={scaled ? '' : undefined}>
      <div class="ca-pstage__frame" id="{splitId}-frame" role="group" aria-label={label}>
        {#if children}
          {#if scheme === 'inherit' && !preset}
            <div class="ca-pstage__content">{@render children()}</div>
          {:else}
            <ThemeIsland scheme={scheme === 'inherit' ? (colorScheme.resolved === 'dark' ? 'dark' : 'light') : scheme} {preset} class="ca-pstage__island">
              <div class="ca-pstage__content">{@render children()}</div>
            </ThemeIsland>
          {/if}
        {:else if src}
          <iframe
            class="ca-pstage__iframe"
            title={label}
            {src}
            loading="lazy"
            data-loaded={loaded ? '' : undefined}
            onload={() => (loaded = true)}
          ></iframe>
          {#if !loaded}<span class="ca-pstage__loading" role="status">{t().previewStage.loading}</span>{/if}
        {/if}
      </div>
      <!-- A window splitter (WAI-ARIA APG): the value is the frame width in px. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        aria-label={t().previewStage.resize}
        aria-valuenow={Math.round(shown)}
        aria-valuemin={minWidth}
        aria-valuemax={Math.round(Math.max(max, shown))}
        aria-controls="{splitId}-frame"
        class="ca-pstage__handle"
        data-active={dragging ? '' : undefined}
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={() => (dragging = false)}
        onkeydown={key}
      ></div>
    </div>
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-pstage {
      display: grid;
      grid-template-rows: auto 1fr;
      gap: var(--ca-space-2);
      min-width: 0;
    }
    .ca-pstage__bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-space-3);
    }
    .ca-pstage__readout {
      font-family: var(--ca-font-mono);
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .ca-pstage__canvas {
      position: relative;
      min-width: 0;
      /* Height is fixed up front: a lazily loaded page or demo never shifts what is below. */
      height: calc(var(--pstage-h) * var(--pstage-scale));
      min-height: 12rem;
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-sunken, var(--ca-surface-raised));
      box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
      overflow: hidden;
    }
    /* The viewport holds the frame at its real width and scales the whole thing to fit the stage. */
    .ca-pstage__viewport {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 50%;
      width: var(--pstage-w);
      height: var(--pstage-h);
      transform: translateX(-50%) scale(var(--pstage-scale));
      transform-origin: top center;
    }
    :global([dir='rtl']) .ca-pstage__viewport { transform: translateX(50%) scale(var(--pstage-scale)); }
    .ca-pstage__frame {
      position: absolute;
      inset: 0;
      overflow: auto;
      background: var(--ca-surface-base);
      box-shadow: var(--ca-shadow-sm, 0 0 0 transparent);
    }
    /* The island is as tall as the frame (not the window), so the content centres in the stage. */
    .ca-pstage__frame > :global(.ca-pstage__island) {
      display: flex;
      min-height: 0;
      height: 100%;
      isolation: isolate;
    }
    .ca-pstage__content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-4);
      flex: 1;
      min-width: 0;
      min-height: 100%;
      padding: var(--ca-space-6);
      box-sizing: border-box;
    }
    .ca-pstage__frame > .ca-pstage__content { height: 100%; }
    .ca-pstage__iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: var(--ca-surface-base);
    }
    .ca-pstage__loading {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      pointer-events: none;
    }
    .ca-pstage__iframe[data-loaded] + .ca-pstage__loading { display: none; }
    /* A 1px rule with a wide grab area, on the frame's trailing edge. */
    .ca-pstage__handle {
      position: absolute;
      inset-block: 0;
      inset-inline-end: calc(var(--ca-space-3) * -1);
      width: var(--ca-space-3);
      cursor: col-resize;
      touch-action: none;
      display: grid;
      place-items: center;
    }
    .ca-pstage__handle::before {
      content: '';
      width: var(--ca-space-1);
      height: var(--ca-space-10);
      max-height: 40%;
      border-radius: var(--ca-radius-pill);
      background: var(--ca-outline-strong, var(--ca-outline-subtle));
    }
    .ca-pstage__handle::after {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline: calc(var(--ca-space-2) * -1);
    }
    .ca-pstage__handle:hover::before,
    .ca-pstage__handle[data-active]::before { background: var(--ca-brand-fill); }
    .ca-pstage__handle:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
    }
    .ca-pstage[data-dragging] { user-select: none; }
    .ca-pstage[data-dragging] .ca-pstage__iframe { pointer-events: none; }
    @media (forced-colors: active) {
      .ca-pstage__canvas { border: var(--ca-border-width) solid CanvasText; }
      .ca-pstage__handle::before { background: CanvasText; forced-color-adjust: none; }
      .ca-pstage__handle:hover::before,
      .ca-pstage__handle:focus-visible::before,
      .ca-pstage__handle[data-active]::before { background: Highlight; }
    }
}
</style>

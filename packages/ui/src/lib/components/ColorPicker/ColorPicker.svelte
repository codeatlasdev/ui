<script lang="ts">
  import { untrack } from 'svelte';
  import SwatchGroup from '../SwatchGroup/SwatchGroup.svelte';
  import { formatColor, maxChroma, oklchSlice, peakChroma, parseColorInput, type Oklch } from '../../utils/color.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { colorPicker } from '../../i18n/groups/colorPicker.js';
  const t = useMessages(colorPicker);

  /**
   * ColorPicker: an OKLCH color area, a hue slider, an optional opacity slider and swatches.
   *
   *   <ColorPicker label="Brand" bind:value={brand} alpha swatches={['#ef4444', '#22c55e']} />
   *
   * `value` is a CSS color string: `oklch(L C H)` by default (`/ alpha` once translucent), `#rrggbb`
   * (`#rrggbbaa`) with `format="hex"`. The area is lightness (up) by chroma (right) at the current
   * hue, drawn only inside the sRGB gamut, so it never offers a color the screen would clip. It is one
   * `role="slider"` (lightness is its value, `aria-valuetext` says both axes in words): arrows move
   * it, Shift moves ten times as far, Home/End go to no chroma and to the gamut edge.
   */
  interface Props {
    /** Names the color area ("Brand color") and groups the controls. */
    label: string;
    /** Bindable CSS color. A string that is not a color is ignored. */
    value?: string;
    /** What `value` is written as. @default "oklch" */
    format?: 'oklch' | 'hex';
    /** Adds the opacity slider; `value` then carries alpha. @default false */
    alpha?: boolean;
    /** Colors to pick from, any CSS color. The one equal to `value` shows as checked. */
    swatches?: string[];
    disabled?: boolean;
    class?: string;
    onchange?: (value: string) => void;
  }

  let {
    label,
    value = $bindable('oklch(0.6 0.15 250)'),
    format = 'oklch',
    alpha = false,
    swatches,
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  const STEP_L = 0.01;
  const STEP_C = 0.005;
  const STEP_H = 1;
  const STEP_A = 0.01;
  const BIG = 10;

  /** `oklch()` is read exactly (a hex round trip would move the hue of a gray); everything else goes through the shared parser. */
  function read(css: string): { lch: Oklch; a: number } | null {
    const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/i.exec(css.trim());
    if (m) {
      const a = m[5] === undefined ? 1 : m[6] ? +m[5] / 100 : +m[5];
      return { lch: { l: m[2] ? +m[1] / 100 : +m[1], c: +m[3], h: +m[4] % 360 }, a: Math.min(1, a) };
    }
    const p = parseColorInput(css);
    return p ? { lch: p.oklch, a: p.alpha } : null;
  }

  const start = untrack(() => read(value));
  let lch = $state<Oklch>(start?.lch ?? { l: 0.6, c: 0.15, h: 250 });
  let a = $state(start?.a ?? 1);
  let emitted = untrack(() => value);

  // A value set from outside wins; the one this component wrote itself is not parsed back (it would round).
  $effect(() => {
    if (value === emitted) return;
    const next = read(value);
    if (!next) return;
    emitted = value;
    lch = next.lch;
    a = next.a;
  });

  /** Right edge of the area at this hue: its highest in-gamut chroma, so the area is filled instead of mostly empty. */
  const cmax = $derived(peakChroma(lch.h) * 1.02);
  const edge = $derived(maxChroma(lch.l, lch.h));
  /** Chroma as a share of what this lightness and hue allow: what the area's horizontal axis shows. */
  const share = $derived(edge > 0 ? Math.min(1, lch.c / edge) : 0);

  function commit(next: Partial<Oklch> & { a?: number }) {
    if (disabled) return;
    const h = next.h === undefined ? lch.h : ((next.h % 360) + 360) % 360;
    const l = Math.min(1, Math.max(0, next.l ?? lch.l));
    const c = Math.min(maxChroma(l, h), Math.max(0, next.c ?? lch.c));
    lch = { l, c, h };
    a = Math.min(1, Math.max(0, next.a ?? a));
    const out = formatColor(lch, alpha ? a : 1, format);
    emitted = out;
    if (out === value) return;
    value = out;
    onchange?.(out);
  }

  // ── Area ──
  let area = $state<HTMLElement>();
  let dragging = $state(false);

  function fromPointer(e: PointerEvent) {
    if (!area) return;
    const r = area.getBoundingClientRect();
    const x = r.width > 0 ? (e.clientX - r.left) / r.width : 0;
    const y = r.height > 0 ? (e.clientY - r.top) / r.height : 0;
    commit({ l: 1 - Math.min(1, Math.max(0, y)), c: Math.min(1, Math.max(0, x)) * cmax });
  }

  function areaDown(e: PointerEvent) {
    if (disabled || e.button !== 0 || !area) return;
    e.preventDefault();
    area.setPointerCapture(e.pointerId);
    dragging = true;
    fromPointer(e);
    thumb?.focus();
  }
  function areaMove(e: PointerEvent) {
    if (dragging) fromPointer(e);
  }
  function areaUp(e: PointerEvent) {
    if (area?.hasPointerCapture(e.pointerId)) area.releasePointerCapture(e.pointerId);
    dragging = false;
  }

  let thumb = $state<HTMLElement>();
  function areaKey(e: KeyboardEvent) {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.shiftKey ? BIG : 1;
    const rtl = area ? getComputedStyle(area).direction === 'rtl' : false;
    switch (e.key) {
      case 'ArrowUp': commit({ l: lch.l + STEP_L * k }); break;
      case 'ArrowDown': commit({ l: lch.l - STEP_L * k }); break;
      case 'ArrowRight': commit({ c: lch.c + (rtl ? -1 : 1) * STEP_C * k }); break;
      case 'ArrowLeft': commit({ c: lch.c + (rtl ? 1 : -1) * STEP_C * k }); break;
      case 'PageUp': commit({ l: lch.l + STEP_L * BIG }); break;
      case 'PageDown': commit({ l: lch.l - STEP_L * BIG }); break;
      case 'Home': commit({ c: 0 }); break;
      case 'End': commit({ c: edge }); break;
      default: return;
    }
    e.preventDefault();
  }

  // ── Hue and opacity: one-axis sliders on a painted track ──
  function trackKey(e: KeyboardEvent, cur: number, step: number, min: number, max: number, set: (v: number) => void) {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.shiftKey ? BIG : 1;
    const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl';
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': set(cur + (e.key === 'ArrowRight' && rtl ? -1 : 1) * step * k); break;
      case 'ArrowLeft': case 'ArrowDown': set(cur - (e.key === 'ArrowLeft' && rtl ? -1 : 1) * step * k); break;
      case 'PageUp': set(cur + step * BIG); break;
      case 'PageDown': set(cur - step * BIG); break;
      case 'Home': set(min); break;
      case 'End': set(max); break;
      default: return;
    }
    e.preventDefault();
  }

  function trackPointer(node: HTMLElement, set: (ratio: number) => void) {
    let on = false;
    const at = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      set(r.width > 0 ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0);
    };
    const down = (e: PointerEvent) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();
      node.setPointerCapture(e.pointerId);
      on = true;
      at(e);
      node.querySelector<HTMLElement>('[role="slider"]')?.focus();
    };
    const move = (e: PointerEvent) => on && at(e);
    const up = (e: PointerEvent) => {
      if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
      on = false;
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  }

  const hueTrack = (node: HTMLElement) => trackPointer(node, (r) => commit({ h: r * 360 }));
  const alphaTrack = (node: HTMLElement) => trackPointer(node, (r) => commit({ a: r }));

  /** The slice is painted at 160 x 120 and scaled by CSS: smooth enough for a gradient, cheap enough to repaint on every hue step. */
  const SLICE_W = 160;
  const SLICE_H = 120;
  let canvas = $state<HTMLCanvasElement>();
  $effect(() => {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const px = oklchSlice(lch.h, SLICE_W, SLICE_H, cmax);
    ctx.putImageData(new ImageData(px, SLICE_W, SLICE_H), 0, 0);
  });
  const solid = $derived(`oklch(${lch.l} ${lch.c} ${lch.h})`);
  const swatchItems = $derived((swatches ?? []).map((c) => ({ value: c, label: c, color: c })));
  const picked = $derived.by(() => {
    const own = read(value);
    if (!own) return '';
    return (swatches ?? []).find((s) => {
      const p = read(s);
      return p && Math.abs(p.lch.l - own.lch.l) < 0.01 && Math.abs(p.lch.c - own.lch.c) < 0.01 && Math.abs(p.lch.h - own.lch.h) < 2 && Math.abs(p.a - own.a) < 0.01;
    }) ?? '';
  });
  function pickSwatch(s: string) {
    const p = read(s);
    if (p) commit({ ...p.lch, a: p.a });
  }
</script>

<div
  class="ca-color-picker {className}"
  role="group"
  aria-label={label}
  data-disabled={disabled ? '' : undefined}
  style:--ca-color-picker-hue={lch.h}
  style:--ca-color-picker-color={solid}
  style:--ca-color-picker-x="{(lch.c / cmax) * 100}%"
  style:--ca-color-picker-y="{(1 - lch.l) * 100}%"
>
  <div
    bind:this={area}
    role="presentation"
    class="ca-color-picker__area"
    data-dragging={dragging ? '' : undefined}
    onpointerdown={areaDown}
    onpointermove={areaMove}
    onpointerup={areaUp}
    onpointercancel={areaUp}
  >
    <canvas bind:this={canvas} class="ca-color-picker__slice" width={SLICE_W} height={SLICE_H} aria-hidden="true"></canvas>
    <span
      bind:this={thumb}
      role="slider"
      tabindex={disabled ? -1 : 0}
      class="ca-color-picker__thumb"
      aria-label={t().colorPicker.area(label)}
      aria-roledescription={t().colorPicker.areaRole}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(lch.l * 100)}
      aria-valuetext={t().colorPicker.areaText(lch.l, share, t().colorPicker.vivid(share))}
      aria-disabled={disabled ? 'true' : 'false'}
      onkeydown={areaKey}
    ></span>
  </div>

  <div class="ca-color-picker__track ca-color-picker__hue" {@attach hueTrack}>
    <span
      role="slider"
      tabindex={disabled ? -1 : 0}
      class="ca-color-picker__thumb"
      style:--ca-color-picker-pos="{(lch.h / 360) * 100}%"
      aria-label={t().colorPicker.hue}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(lch.h)}
      aria-valuetext={t().colorPicker.hueText(lch.h)}
      aria-disabled={disabled ? 'true' : 'false'}
      onkeydown={(e) => trackKey(e, lch.h, STEP_H, 0, 359, (h) => commit({ h }))}
    ></span>
  </div>

  {#if alpha}
    <div class="ca-color-picker__track ca-color-picker__alpha" {@attach alphaTrack}>
      <span
        role="slider"
        tabindex={disabled ? -1 : 0}
        class="ca-color-picker__thumb"
        style:--ca-color-picker-pos="{a * 100}%"
        aria-label={t().colorPicker.alpha}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(a * 100)}
        aria-valuetext={t().colorPicker.alphaText(a)}
        aria-disabled={disabled ? 'true' : 'false'}
        onkeydown={(e) => trackKey(e, a, STEP_A, 0, 1, (v) => commit({ a: v }))}
      ></span>
    </div>
  {/if}

  {#if swatchItems.length > 0}
    <SwatchGroup
      size="sm"
      aria-label={t().colorPicker.swatches}
      items={swatchItems}
      {disabled}
      value={picked}
      onchange={pickSwatch}
    />
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-color-picker) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-color-picker-gap, var(--ca-space-3));
      inline-size: var(--ca-color-picker-width, 100%);
      min-inline-size: 0;
    }

    /* Lightness runs top (white) to bottom (black); chroma left (gray) to right. The slice is
       transparent past the sRGB gamut edge, so the surface shows there and the area never paints
       a color the screen cannot display. */
    :global(.ca-color-picker__area) {
      position: relative;
      aspect-ratio: var(--ca-color-picker-ratio, 4 / 3);
      border-radius: var(--ca-color-picker-radius, var(--ca-radius-md));
      background: var(--ca-surface-sunken);
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-control);
      cursor: crosshair;
      touch-action: none;
      user-select: none;
    }
    :global(.ca-color-picker__slice) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      border-radius: inherit;
      pointer-events: none;
    }

    :global(.ca-color-picker__track) {
      position: relative;
      block-size: var(--ca-color-picker-track-height, var(--ca-space-4));
      border-radius: var(--ca-radius-pill);
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-control);
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    :global(.ca-color-picker__hue) {
      background: linear-gradient(
        to right,
        oklch(0.7 0.15 0), oklch(0.7 0.15 60), oklch(0.7 0.15 120), oklch(0.7 0.15 180),
        oklch(0.7 0.15 240), oklch(0.7 0.15 300), oklch(0.7 0.15 360)
      );
    }
    /* A checkerboard under the ramp so transparency reads as transparency, not as a lighter color. */
    :global(.ca-color-picker__alpha) {
      background:
        linear-gradient(to right, oklch(0 0 0 / 0), var(--ca-color-picker-color)),
        repeating-conic-gradient(var(--ca-outline-default) 0 25%, transparent 0 50%) 0 0 / var(--ca-space-3) var(--ca-space-3);
    }

    :global(.ca-color-picker__thumb) {
      position: absolute;
      display: grid;
      place-items: center;
      inline-size: var(--ca-color-picker-thumb-size, var(--ca-space-5));
      block-size: var(--ca-color-picker-thumb-size, var(--ca-space-5));
      border-radius: var(--ca-radius-round);
      translate: -50% -50%;
      inset-inline-start: var(--ca-color-picker-pos, var(--ca-color-picker-x));
      inset-block-start: var(--ca-color-picker-top, var(--ca-color-picker-y));
      cursor: grab;
    }
    :global(.ca-color-picker__thumb::before) {
      content: "";
      inline-size: var(--ca-color-picker-thumb-size, var(--ca-space-5));
      block-size: var(--ca-color-picker-thumb-size, var(--ca-space-5));
      box-sizing: border-box;
      border-radius: var(--ca-radius-round);
      background: var(--ca-color-picker-color);
      border: var(--ca-border-width-strong) solid #fff;
      box-shadow: 0 0 0 var(--ca-border-width) var(--ca-outline-control), var(--ca-shadow-sm);
    }
    :global(.ca-color-picker__track .ca-color-picker__thumb) {
      --ca-color-picker-top: 50%;
    }
    :global(.ca-color-picker__thumb:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-space-0-5);
    }
    :global(.ca-color-picker__area[data-dragging] .ca-color-picker__thumb) {
      cursor: grabbing;
    }

    :global(.ca-color-picker[data-disabled]) {
      filter: grayscale(1);
    }
    :global(.ca-color-picker[data-disabled] .ca-color-picker__area),
    :global(.ca-color-picker[data-disabled] .ca-color-picker__track),
    :global(.ca-color-picker[data-disabled] .ca-color-picker__thumb) {
      cursor: not-allowed;
    }

    /* The hit area is a touch target; the painted thumb keeps its size. */
    @media (pointer: coarse) {
      :global(.ca-color-picker__thumb) {
        inline-size: max(var(--ca-color-picker-thumb-size, var(--ca-space-5)), var(--ca-touch-target));
        block-size: max(var(--ca-color-picker-thumb-size, var(--ca-space-5)), var(--ca-touch-target));
      }
    }

    /* Forced colors drop fills and shadows: the area and tracks keep an edge, and the thumb keeps its color with a text-colored ring. */
    @media (forced-colors: active) {
      :global(.ca-color-picker__area),
      :global(.ca-color-picker__track) {
        border: var(--ca-border-width) solid CanvasText;
        forced-color-adjust: none;
      }
      :global(.ca-color-picker__thumb::before) {
        border-color: CanvasText;
        forced-color-adjust: none;
      }
    }
}
</style>

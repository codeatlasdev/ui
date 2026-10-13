<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';

  /**
   * Slider — single or range value input.
   *
   * Single value (most common):
   *   <Slider bind:value={volume} min={0} max={100} />
   *
   * Range (two thumbs):
   *   <Slider bind:values={range} min={0} max={100} />
   *
   * `value` and `values` are independent — use one or the other.
   * `onchange` always receives the normalized array (length 1 or 2).
   */

  interface Props {
    /** Single-value mode — binds a plain number. */
    value?:    number;
    /** Range mode — binds a [min, max] tuple. */
    values?:   [number, number];
    min?:      number;
    max?:      number;
    step?:     number;
    disabled?: boolean;
    class?:    string;
    /** Called on change. Always receives array regardless of single/range mode. */
    onchange?: (value: number[]) => void;
  }

  let {
    value    = $bindable<number | undefined>(undefined),
    values   = $bindable<[number, number] | undefined>(undefined),
    min      = 0,
    max      = 100,
    step     = 1,
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  /** Snap to the nearest `step` from `min`, clamped, without float drift (0.1 steps etc.). */
  function snap(v: number): number {
    const s = step > 0 ? step : 1;
    const decimals = (String(s).split('.')[1] ?? '').length;
    const snapped = min + Math.round((v - min) / s) * s;
    return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))));
  }

  // Normalise to an array: one thumb per entry, whichever binding the consumer uses.
  const internal = $derived.by<number[]>(() => {
    const raw = values !== undefined ? values : value !== undefined ? [value] : [Math.round((min + max) / 2)];
    return raw.map(snap);
  });

  function commit(next: number[]) {
    if (next.length === internal.length && next.every((n, i) => n === internal[i])) return;
    if (values !== undefined) values = [next[0], next[1] ?? values[1]];
    else value = next[0];
    onchange?.(next);
  }

  /** Set thumb `i` to `v`; thumbs keep their order (a thumb pushed past its neighbour swaps with it). */
  function setThumb(i: number, v: number): number {
    const next = [...internal];
    const target = snap(v);
    next[i] = target;
    let idx = i;
    // Dragging past a neighbour swaps them, so the active thumb index follows the value.
    while (idx > 0 && next[idx] < next[idx - 1]) {
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      idx -= 1;
    }
    while (idx < next.length - 1 && next[idx] > next[idx + 1]) {
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      idx += 1;
    }
    commit(next);
    return idx;
  }

  let root = $state<HTMLElement>();
  let thumbEls = $state<HTMLElement[]>([]);
  let active = $state<number | null>(null);

  const span = $derived(max - min || 1);
  const pct = (v: number) => ((v - min) / span) * 100;

  // The thumb is centred on its value but kept inside the track: positions live on a scale
  // inset by half a thumb on both ends.
  let inset = $state(0);
  function measure() {
    const thumb = thumbEls[0];
    if (root && thumb && root.offsetWidth > 0) inset = (thumb.offsetWidth / 2 / root.offsetWidth) * 100;
  }
  $effect(() => {
    void internal.length;
    if (!root) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  });
  const pos = (v: number) => inset + (pct(v) * (100 - 2 * inset)) / 100;

  const rangeStart = $derived(internal.length > 1 ? pos(Math.min(...internal)) : 0);
  const rangeEnd = $derived(100 - pos(Math.max(...internal)));

  function valueAt(clientX: number) {
    const r = root!.getBoundingClientRect();
    const ratio = r.width > 0 ? (clientX - r.left) / r.width : 0;
    return min + Math.min(1, Math.max(0, ratio)) * (max - min);
  }

  function closestThumb(clientX: number) {
    let best = 0;
    let dist = Infinity;
    thumbEls.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs(clientX - (r.left + r.right) / 2);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  }

  function onpointerdown(e: PointerEvent) {
    if (disabled || e.button !== 0 || !root) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    active = setThumb(closestThumb(e.clientX), valueAt(e.clientX));
    thumbEls[active]?.focus();
  }

  function onpointermove(e: PointerEvent) {
    if (active === null || disabled) return;
    active = setThumb(active, valueAt(e.clientX));
    thumbEls[active]?.focus();
  }

  function endDrag(e: PointerEvent) {
    if (root?.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
    active = null;
  }

  function onkeydown(e: KeyboardEvent, i: number) {
    if (disabled || e.altKey || e.ctrlKey) return;
    const rtl = root ? getComputedStyle(root).direction === 'rtl' : false;
    const s = step > 0 ? step : 1;
    const cur = internal[i];
    let next: number;
    switch (e.key) {
      case 'ArrowRight': next = cur + (rtl ? -s : s); break;
      case 'ArrowUp': next = cur + s; break;
      case 'ArrowLeft': next = cur + (rtl ? s : -s); break;
      case 'ArrowDown': next = cur - s; break;
      case 'PageUp': next = cur + s * 10; break;
      case 'PageDown': next = cur - s * 10; break;
      case 'Home': next = min; break;
      case 'End': next = max; break;
      default: return;
    }
    e.preventDefault();
    const idx = setThumb(i, next);
    if (idx !== i) thumbEls[idx]?.focus();
  }
</script>

<div
  bind:this={root}
  role="group"
  class="ca-slider {className}"
  data-orientation="horizontal"
  data-disabled={disabled ? '' : undefined}
  {onpointerdown}
  {onpointermove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
>
  <div class="ca-slider__track">
    <span
      class="ca-slider__range"
      data-orientation="horizontal"
      data-disabled={disabled ? '' : undefined}
      style="left:{rangeStart}%;right:{rangeEnd}%"
    ></span>
  </div>
  {#each internal as v, i (i)}
    <span
      bind:this={thumbEls[i]}
      role="slider"
      tabindex={disabled ? -1 : 0}
      class="ca-slider__thumb"
      aria-label={t().slider.value(v)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={v}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-orientation="horizontal"
      data-value={v}
      data-orientation="horizontal"
      data-active={active === i ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      style="position:absolute;left:{pos(v)}%;translate:-50% 0"
      onkeydown={(e) => onkeydown(e, i)}
    ></span>
  {/each}
</div>

<style>
  :global(.ca-slider) {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: var(--ca-space-5);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }

  :global(.ca-slider[data-disabled]) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .ca-slider__track {
    position: relative;
    flex: 1;
    height: var(--ca-space-1);
    background: var(--ca-outline-default);
    border-radius: var(--ca-radius-pill);
    overflow: visible;
  }

  :global(.ca-slider__range) {
    position: absolute;
    height: 100%;
    background: var(--ca-brand-main);
    border-radius: var(--ca-radius-pill);
  }

  :global(.ca-slider__thumb) {
    display: block;
    width: var(--ca-space-5);
    height: var(--ca-space-5);
    border-radius: 50%;
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width-strong) solid var(--ca-brand-main);
    box-shadow: var(--ca-shadow-sm);
    cursor: grab;
    transition:
      box-shadow var(--ca-duration-fast) var(--ca-ease-standard),
      transform  var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-slider__thumb:hover) {
    box-shadow: var(--ca-shadow-md), 0 0 0 var(--ca-space-1) color-mix(in oklab, var(--ca-brand-main) 16%, transparent);
    transform: scale(1.1);
  }

  :global(.ca-slider__thumb:active) {
    cursor: grabbing;
    transform: scale(1.15);
  }

  :global(.ca-slider__thumb:focus-visible) {
    outline: none;
    box-shadow:
      var(--ca-shadow-sm),
      0 0 0 var(--ca-space-0-5) var(--ca-surface-base),
      0 0 0 calc(var(--ca-space-0-5) + var(--ca-border-width-focus)) var(--ca-brand-main);
  }
</style>

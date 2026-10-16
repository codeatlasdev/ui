<script module lang="ts">
  /** The one element allowed to play: starting another player pauses this one. */
  let current: HTMLAudioElement | null = null;
  let uid = 0;
</script>

<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { Pause, Play } from '@lucide/svelte';
  import IconButton from '../Button/IconButton.svelte';
  import Spinner from '../Spinner/Spinner.svelte';
  import { useT } from '../../i18n/state.svelte.js';
  const t = useT();

  /**
   * AudioPlayer: a voice-message player with a waveform scrubber (the native `<audio controls>` is
   * unstyled, differs per browser and is poor in dark mode and on iOS).
   *
   * - Lazy: with `preload="none"` the `<audio>` gets its `src` only on the first play (or first
   *   seek), so no request is made until the user asks for it. Give `duration` and the UI is fully
   *   usable before that.
   * - The waveform is the scrub control (`role="slider"`): arrows and Page keys seek, Home/End jump,
   *   pointer click or drag seeks, RTL aware.
   * - One at a time: starting a player pauses the one that was playing.
   *
   * Usage:
   *   <AudioPlayer src={url} duration={31} peaks={peaks} onended={markListened} />
   */
  interface Props {
    /** Audio URL. Not requested until the first play when `preload` is `none`. */
    src: string;
    /** Waveform amplitudes, 0 to 1, any length. Resampled to the width (max per bucket). Absent: a flat placeholder. */
    peaks?: number[];
    /** Length in seconds, shown before the metadata loads. Replaced by the real length once known. */
    duration?: number;
    /** Playback speeds the rate button cycles through. */
    rates?: number[];
    /** `none` attaches `src` on the first play; `metadata` attaches it at once and reads the length. */
    preload?: 'none' | 'metadata';
    /** Accessible name of the player group. Defaults to the localized "Audio message". */
    label?: string;
    /** Called when playback starts. */
    onplay?: (e: Event) => void;
    /** Called when playback pauses. */
    onpause?: (e: Event) => void;
    /** Called when the audio reaches its end. */
    onended?: (e: Event) => void;
    /** Called when the audio cannot be loaded or played. */
    onerror?: (e: Event) => void;
    /** Extra class on the root. */
    class?: string;
  }

  let {
    src,
    peaks,
    duration,
    rates = [1, 1.5, 2],
    preload = 'none',
    label,
    onplay,
    onpause,
    onended,
    onerror,
    class: className = '',
  }: Props = $props();

  const id = `ca-audio-${++uid}`;
  const BAR = 3; // px, mirrors --ca-audio-bar-w
  const GAP = 2; // px, mirrors --ca-audio-bar-gap
  const PLACEHOLDER = [0.18, 0.12, 0.22, 0.15, 0.2, 0.1];

  let audio = $state<HTMLAudioElement>();
  let scrubber = $state<HTMLElement>();
  let wave = $state<HTMLElement>();
  let width = $state(0);

  // Seeded once: `preload` is an initial choice, later plays attach the source anyway.
  let attached = $state(untrack(() => preload === 'metadata'));
  let playing = $state(false);
  let busy = $state(false);
  let failed = $state(false);
  let time = $state(0);
  let realDuration = $state<number>();
  let rateIndex = $state(0);
  let dragging = false;
  let raf = 0;

  const total = $derived(realDuration ?? duration ?? 0);
  const rate = $derived(rates[rateIndex % Math.max(rates.length, 1)] ?? 1);
  const rateText = $derived(`${rate}x`);
  const fraction = $derived(total > 0 ? Math.min(1, time / total) : 0);

  const barCount = $derived(Math.max(1, Math.floor((width + GAP) / (BAR + GAP))));
  /** Max-per-bucket resample, so a short spike survives a heavy downsample. */
  const heights = $derived.by(() => {
    const n = barCount;
    if (!peaks?.length) return Array.from({ length: n }, (_, i) => PLACEHOLDER[i % PLACEHOLDER.length]);
    return Array.from({ length: n }, (_, i) => {
      const from = Math.floor((i * peaks.length) / n);
      const to = Math.max(from + 1, Math.floor(((i + 1) * peaks.length) / n));
      let max = 0;
      for (let k = from; k < to && k < peaks.length; k++) max = Math.max(max, peaks[k] ?? 0);
      return Math.min(1, Math.max(0.06, max));
    });
  });

  function mmss(s: number) {
    const n = Math.max(0, Math.floor(Number.isFinite(s) ? s : 0));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  }

  // `src` is attached once the user asks for audio; the element keeps it afterwards.
  const mediaSrc = $derived(attached ? src : undefined);

  $effect(() => {
    if (audio) audio.playbackRate = rate;
  });

  // A new `src` starts over.
  let lastSrc = untrack(() => src);
  $effect(() => {
    if (src === lastSrc) return;
    lastSrc = src;
    time = 0;
    realDuration = undefined;
    failed = false;
    playing = false;
  });

  function sync() {
    if (audio) time = audio.currentTime;
  }
  function tick() {
    sync();
    raf = playing ? requestAnimationFrame(tick) : 0;
  }
  function startTicking() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function readDuration() {
    const d = audio?.duration;
    if (d !== undefined && Number.isFinite(d)) realDuration = d;
  }

  function onPlay(e: Event) {
    if (current && current !== audio) current.pause();
    current = audio ?? null;
    playing = true;
    startTicking();
    onplay?.(e);
  }
  function onPause(e: Event) {
    playing = false;
    sync();
    onpause?.(e);
  }
  function onEnded(e: Event) {
    playing = false;
    busy = false;
    time = 0;
    if (audio) audio.currentTime = 0;
    onended?.(e);
  }
  function onError(e: Event) {
    // Without a src the element has nothing to fail on (a lazy player that was never started).
    if (!attached) return;
    failed = true;
    busy = false;
    playing = false;
    onerror?.(e);
  }

  async function toggle() {
    if (!audio || failed) return;
    if (playing) {
      audio.pause();
      return;
    }
    if (!attached) {
      attached = true;
      busy = true;
      await Promise.resolve(); // let the src attribute land before play()
    }
    try {
      await audio.play();
    } catch (err) {
      // An aborted play (paused or src swapped meanwhile) is not an error; the `error` event reports real ones.
      if (!(err instanceof DOMException && err.name === 'AbortError')) busy = false;
    }
  }

  function cycleRate() {
    rateIndex = (rateIndex + 1) % Math.max(rates.length, 1);
  }

  /** Seek to `seconds`, attaching the src first when still lazy (seeking is not playing). */
  async function seekTo(seconds: number) {
    if (!audio || failed || total <= 0) return;
    const next = Math.min(total, Math.max(0, seconds));
    time = next;
    if (!attached) {
      attached = true;
      await Promise.resolve();
    }
    // Before metadata arrives the element ignores the assignment: apply it when it does.
    if (audio.readyState >= 1) audio.currentTime = next;
    else
      audio.addEventListener('loadedmetadata', () => audio && (audio.currentTime = next), { once: true });
  }

  const STEPS: Record<string, number> = {
    ArrowRight: 5,
    ArrowUp: 5,
    ArrowLeft: -5,
    ArrowDown: -5,
    PageUp: 10,
    PageDown: -10,
  };
  function onKeydown(e: KeyboardEvent) {
    if (failed) return;
    let target: number | undefined;
    if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = total;
    else if (e.key in STEPS) target = time + STEPS[e.key];
    if (target === undefined) return;
    e.preventDefault();
    void seekTo(target);
  }

  function seekFromPointer(e: PointerEvent) {
    if (!scrubber || total <= 0) return;
    const r = scrubber.getBoundingClientRect();
    if (r.width <= 0) return;
    let f = (e.clientX - r.left) / r.width;
    if (getComputedStyle(scrubber).direction === 'rtl') f = 1 - f;
    void seekTo(Math.min(1, Math.max(0, f)) * total);
  }
  function onPointerdown(e: PointerEvent) {
    if (failed || e.button !== 0) return;
    dragging = true;
    scrubber?.setPointerCapture?.(e.pointerId);
    seekFromPointer(e);
  }
  function onPointermove(e: PointerEvent) {
    if (dragging) seekFromPointer(e);
  }
  function onPointerup(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    if (scrubber?.hasPointerCapture?.(e.pointerId)) scrubber.releasePointerCapture(e.pointerId);
  }

  // The waveform width drives the bar count.
  $effect(() => {
    if (!wave) return;
    const ro = new ResizeObserver(() => {
      width = wave?.clientWidth ?? 0;
    });
    ro.observe(wave);
    width = wave.clientWidth;
    return () => ro.disconnect();
  });

  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    audio?.pause();
    if (current === audio) current = null;
  });
</script>

<div
  role="group"
  aria-label={label ?? t().audioPlayer.label}
  aria-busy={busy && !failed ? 'true' : undefined}
  aria-describedby={failed ? `${id}-error` : undefined}
  class="ca-audio {className}"
  class:ca-audio--error={failed}
  class:ca-audio--playing={playing}
>
  <audio
    bind:this={audio}
    src={mediaSrc}
    preload={attached ? 'metadata' : 'none'}
    onplay={onPlay}
    onpause={onPause}
    onended={onEnded}
    onerror={onError}
    onloadstart={() => attached && !failed && (busy = true)}
    onwaiting={() => (busy = true)}
    onplaying={() => (busy = false)}
    oncanplay={() => (busy = false)}
    onloadedmetadata={() => {
      readDuration();
      if (!playing) busy = false;
    }}
    ondurationchange={readDuration}
    ontimeupdate={() => !raf && sync()}
    onseeked={sync}
  ></audio>

  <IconButton
    variant="filled"
    class="ca-audio__play"
    aria-label={playing ? t().audioPlayer.pause : t().audioPlayer.play}
    disabled={failed}
    onclick={toggle}
  >
    {#if playing}<Pause size={18} aria-hidden="true" />{:else}<Play size={18} aria-hidden="true" />{/if}
  </IconButton>

  <div class="ca-audio__wave" bind:this={wave}>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={scrubber}
      class="ca-audio__scrub"
      role="slider"
      tabindex="0"
      aria-label={t().audioPlayer.seek}
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={t().audioPlayer.position(mmss(time), mmss(total))}
      aria-disabled={failed ? 'true' : undefined}
      onkeydown={onKeydown}
      onpointerdown={onPointerdown}
      onpointermove={onPointermove}
      onpointerup={onPointerup}
      onpointercancel={onPointerup}
    >
      {#each heights as h, i (i)}
        <span
          class="ca-audio__bar"
          class:ca-audio__bar--played={(i + 0.5) / heights.length <= fraction}
          style="--h:{h}"
        ></span>
      {/each}
    </div>
  </div>

  <div class="ca-audio__meta">
    {#if busy && !failed}
      <Spinner size={14} label={t().audioPlayer.loading} />
    {/if}
    <span class="ca-audio__time" aria-hidden="true">
      <span class="ca-audio__current">{mmss(time)}</span>
      /
      <span class="ca-audio__total">{mmss(total)}</span>
    </span>
    <button
      type="button"
      class="ca-audio__rate"
      aria-label={t().audioPlayer.rate(rateText)}
      disabled={failed}
      onclick={cycleRate}
    >
      {rateText}
    </button>
  </div>

  {#if failed}
    <p id="{id}-error" class="ca-audio__error">{t().audioPlayer.error}</p>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-audio {
      --ca-audio-bar-w: 3px;
      --ca-audio-bar-gap: 2px;
      --ca-audio-wave-h: var(--ca-space-8);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-space-3);
      min-inline-size: 0;
      inline-size: 100%;
      max-inline-size: calc(var(--ca-space-24) * 3);
    }
    .ca-audio audio {
      display: none;
    }

    .ca-audio__wave {
      flex: 1 1 var(--ca-space-24);
      min-inline-size: 0;
    }
    .ca-audio__scrub {
      display: flex;
      align-items: center;
      gap: var(--ca-audio-bar-gap);
      block-size: var(--ca-audio-wave-h);
      min-block-size: var(--ca-touch-target);
      cursor: pointer;
      touch-action: none;
      user-select: none;
      border-radius: var(--ca-radius-sm);
    }
    .ca-audio__scrub:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }
    .ca-audio__scrub[aria-disabled='true'] {
      cursor: not-allowed;
    }

    .ca-audio__bar {
      flex: 0 0 var(--ca-audio-bar-w);
      block-size: calc(var(--h) * 100%);
      max-block-size: var(--ca-audio-wave-h);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-outline-default);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-audio__bar--played {
      background: var(--ca-brand-fill);
    }

    .ca-audio__meta {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-2);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-caption);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .ca-audio__rate {
      min-block-size: var(--ca-touch-target);
      min-inline-size: var(--ca-touch-target);
      padding-inline: var(--ca-space-2);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
      background: transparent;
      color: var(--ca-text-primary);
      font: inherit;
      cursor: pointer;
    }
    .ca-audio__rate:hover:not(:disabled) {
      background: var(--ca-action-hover);
    }
    .ca-audio__rate:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }
    .ca-audio__rate:disabled {
      color: var(--ca-text-disabled);
      cursor: not-allowed;
    }

    .ca-audio__error {
      flex-basis: 100%;
      margin: 0;
      color: var(--ca-semantic-error);
      font-size: var(--ca-font-size-caption);
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-audio__bar {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .ca-audio__bar {
        background: GrayText;
        forced-color-adjust: none;
      }
      .ca-audio__bar--played {
        background: Highlight;
      }
      .ca-audio__scrub,
      .ca-audio__rate {
        border: 1px solid CanvasText;
      }
      .ca-audio__scrub:focus-visible,
      .ca-audio__rate:focus-visible {
        outline-color: Highlight;
      }
    }
}
</style>

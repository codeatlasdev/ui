<script lang="ts">
  import { onMount, setContext, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { ChevronLeft, ChevronRight, Pause, Play } from '@lucide/svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { carousel } from '../../i18n/groups/carousel.js';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import { CAROUSEL_KEY, type CarouselContext } from './carousel-context.js';
  const t = useMessages(carousel);

  /**
   * Carousel — scroll-snap slides (WAI-ARIA carousel pattern) with previous / next, dots and an
   * opt-in autoplay.
   *
   * <Carousel label="Highlights" bind:index>
   *   <CarouselItem>…</CarouselItem>
   *   <CarouselItem>…</CarouselItem>
   * </Carousel>
   *
   * The strip is native scrolling (touch, trackpad and keyboard just work); the controls move it.
   * Slides outside the view are inert. `autoplay` (ms) is off by default: it adds a Pause button,
   * stops while focus or the pointer is inside, and never runs under `prefers-reduced-motion`.
   */
  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'aria-label' | 'role' | 'onchange'> {
    /** Accessible name of the carousel. */
    label: string;
    /** The first visible slide (0-based). Bindable. */
    index?: number;
    /** Slides visible at once. @default 1 */
    perView?: number;
    /** Wrap around at the ends. @default false */
    loop?: boolean;
    /** Show the dots. @default true */
    dots?: boolean;
    /** Show previous / next. @default true */
    arrows?: boolean;
    /** Milliseconds between slides; unset = no autoplay. */
    autoplay?: number;
    /** Called when the current slide changes. */
    onchange?: (index: number) => void;
    class?: string;
    children?: Snippet;
  }

  let {
    label,
    index = $bindable(0),
    perView = 1,
    loop = false,
    dots = true,
    arrows = true,
    autoplay,
    onchange,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  let root = $state<HTMLElement>();
  let strip = $state<HTMLElement>();
  let items = $state<HTMLElement[]>([]);
  let playing = $state(true);
  let inside = $state(false);

  const total = $derived(items.length);
  const last = $derived(Math.max(0, total - perView));
  const auto = $derived(autoplay !== undefined && autoplay > 0 && !reducedMotion.value);
  const live = $derived(auto && playing && !inside);
  const pages = $derived(Array.from({ length: last + 1 }, (_, i) => i));
  const clamped = (i: number) => Math.min(last, Math.max(0, i));

  const ctx: CarouselContext = {
    register(el) {
      items = [...items, el].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
      return () => (items = items.filter((x) => x !== el));
    },
    count: () => items.length,
    indexOf: (el) => items.indexOf(el),
    visible: (i) => i >= index && i < index + perView,
  };
  setContext<CarouselContext>(CAROUSEL_KEY, ctx);

  // Scroll to `i`; the scroll listener then reports the settled slide, so the dot never leads the strip.
  let target: number | null = null;
  function go(i: number, fromUser = true) {
    const next = loop ? (i < 0 ? last : i > last ? 0 : i) : clamped(i);
    if (fromUser && !auto) playing = false;
    target = next;
    set(next);
    const el = items[next];
    if (strip && el)
      strip.scrollTo({
        left: el.offsetLeft - strip.offsetLeft,
        behavior: reducedMotion.value ? 'instant' : 'smooth',
      });
  }

  function set(next: number) {
    if (next === index) return;
    index = next;
    onchange?.(next);
  }

  // A touch or trackpad scroll: the slide nearest the start edge is the current one.
  let timer: ReturnType<typeof setTimeout> | undefined;
  function onscroll() {
    if (!strip) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!strip) return;
      if (target !== null) {
        target = null;
        return;
      }
      const from = strip.scrollLeft + strip.offsetLeft;
      let best = 0;
      let dist = Infinity;
      items.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft - from);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      set(clamped(best));
    }, 80);
  }

  // A bound `index` set from outside scrolls the strip to it (once the slides are registered).
  $effect(() => {
    const i = index;
    const n = items.length;
    untrack(() => {
      if (!strip || n === 0 || target !== null) return;
      const el = items[clamped(i)];
      if (!el) return;
      const want = el.offsetLeft - strip.offsetLeft;
      if (Math.abs(strip.scrollLeft - want) > 2) strip.scrollTo({ left: want, behavior: 'instant' });
    });
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.target !== root || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = root ? getComputedStyle(root).direction === 'rtl' : false;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) go(index + 1);
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) go(index - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(last);
    else return;
    e.preventDefault();
  }

  // Autoplay: one timer per slide; any change of state restarts it.
  $effect(() => {
    if (!live) return;
    void index;
    const id = setTimeout(() => {
      if (!loop && index >= last) playing = false;
      else go(index + 1, false);
    }, autoplay);
    return () => clearTimeout(id);
  });

  onMount(() => {
    const stopMedia = reducedMotion.init();
    return () => {
      clearTimeout(timer);
      stopMedia();
    };
  });

  const atStart = $derived(!loop && index <= 0);
  const atEnd = $derived(!loop && index >= last);
</script>

<!-- A focusable carousel region (WAI-ARIA APG): arrows, Home and End move the slides while it holds focus. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  {...rest}
  bind:this={root}
  role="region"
  aria-roledescription="carousel"
  aria-label={label}
  tabindex="0"
  class="ca-carousel {className}"
  style:--ca-carousel-per-view={perView}
  onfocusin={() => (inside = true)}
  onfocusout={(e) => {
    if (!root?.contains(e.relatedTarget as Node | null)) inside = false;
  }}
  onmouseenter={() => (inside = true)}
  onmouseleave={() => (inside = false)}
  {onkeydown}
>
  <div
    bind:this={strip}
    class="ca-carousel__viewport"
    aria-live={live ? 'off' : 'polite'}
    {onscroll}
  >
    <div class="ca-carousel__track">{@render children?.()}</div>
  </div>

  {#if arrows || dots || autoplay !== undefined}
    <div class="ca-carousel__controls">
      {#if autoplay !== undefined && !reducedMotion.value}
        <button
          type="button"
          class="ca-carousel__play"
          aria-label={playing ? t().carousel.pause : t().carousel.play}
          onclick={() => (playing = !playing)}
        >
          {#if playing}<Pause size={16} aria-hidden="true" />{:else}<Play size={16} aria-hidden="true" />{/if}
        </button>
      {/if}
      {#if arrows}
        <button
          type="button"
          class="ca-carousel__nav ca-carousel__prev"
          aria-label={t().carousel.previous}
          disabled={atStart}
          onclick={() => go(index - 1)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
      {/if}
      {#if dots && pages.length > 1}
        <div class="ca-carousel__dots">
          {#each pages as p (p)}
            <button
              type="button"
              class="ca-carousel__dot"
              aria-label={t().carousel.goTo(p + 1)}
              aria-current={p === index ? 'true' : undefined}
              onclick={() => go(p)}
            ></button>
          {/each}
        </div>
      {/if}
      {#if arrows}
        <button
          type="button"
          class="ca-carousel__nav ca-carousel__next"
          aria-label={t().carousel.next}
          disabled={atEnd}
          onclick={() => go(index + 1)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-carousel {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-3);
      min-width: 0;
    }
    .ca-carousel:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
      border-radius: var(--ca-radius-md);
    }
    .ca-carousel__viewport {
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
    }
    .ca-carousel__viewport::-webkit-scrollbar { display: none; }
    .ca-carousel__track {
      display: flex;
      gap: 0;
    }
    .ca-carousel__controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-3);
    }
    .ca-carousel__nav,
    .ca-carousel__play {
      display: inline-grid;
      place-items: center;
      width: var(--ca-space-8);
      height: var(--ca-space-8);
      padding: 0;
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-surface-overlay);
      color: var(--ca-text-primary);
      cursor: pointer;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-carousel__nav:hover:not(:disabled),
    .ca-carousel__play:hover { background: var(--ca-state-hover); }
    .ca-carousel__nav:disabled { color: var(--ca-text-disabled); cursor: not-allowed; }
    .ca-carousel__nav:focus-visible,
    .ca-carousel__play:focus-visible,
    .ca-carousel__dot:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
    }
    .ca-carousel__dots { display: flex; align-items: center; gap: var(--ca-space-1); }
    /* 8px dot inside a 24px hit area (44px under a coarse pointer, globally). */
    .ca-carousel__dot {
      position: relative;
      width: var(--ca-space-6);
      height: var(--ca-space-6);
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
    }
    .ca-carousel__dot::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: var(--ca-space-2);
      height: var(--ca-space-2);
      translate: -50% -50%;
      border-radius: 50%;
      background: var(--ca-outline-strong, var(--ca-outline-default));
      transition: background var(--ca-duration-fast) var(--ca-ease-standard), scale var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-carousel__dot[aria-current='true']::after { background: var(--ca-brand-fill); scale: 1.25; }
    @media (prefers-reduced-motion: reduce) {
      .ca-carousel__viewport { scroll-behavior: auto; }
      .ca-carousel__nav, .ca-carousel__play, .ca-carousel__dot::after { transition: none; }
    }
    @media (forced-colors: active) {
      .ca-carousel__nav, .ca-carousel__play { border-color: CanvasText; }
      .ca-carousel__dot::after { background: CanvasText; forced-color-adjust: none; }
      .ca-carousel__dot[aria-current='true']::after { background: Highlight; }
    }
}
</style>

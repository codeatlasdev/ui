<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import Button from '../Button/Button.svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { reducedMotion } from '../../stores/reduced-motion.svelte.js';
  import { createStage, type MotionCtx } from './stage.svelte.js';
  const t = useT();

  /**
   * MotionStage: the frame of a motion demo. It autoplays only while at least half of it is in view
   * and the tab is visible; touching, clicking or focusing the demo takes over (autoplay stops, a
   * Replay button appears); a visible Pause button stops it for good (WCAG 2.2.2). Under
   * `prefers-reduced-motion`, or a theme that turns entrances off (`--ca-enter-scale: 0`), nothing
   * autoplays and `ctx.reduced` tells the demo to render its final state. `ctx.cycle` increments on
   * every loop: key an animation on it to run it again.
   *
   * @example
   * <MotionStage label="Fade rise">
   *   {#snippet children(m)}{#key m.cycle}<div class:run={!m.reduced}>…</div>{/key}{/snippet}
   * </MotionStage>
   */
  interface Props {
    /** Accessible name of the stage (what the demo shows). */
    label: string;
    /** Autoplay loop length in ms; `ctx.cycle` increments once per loop. */
    loop?: number;
    /** Label of the pause button. */
    pauseLabel?: string;
    /** Label of the replay button. */
    replayLabel?: string;
    /** The demo. Receives the stage state (`playing`, `reduced`, `cycle`, `takeover`, `play`, `pause`). */
    children: Snippet<[MotionCtx]>;
  }
  let { label, loop = 3200, pauseLabel, replayLabel, children }: Props = $props();

  // `motion.enter: "none"` in the theme (--ca-enter-scale: 0): entrances are off, so a motion
  // demo renders its final state exactly as under prefers-reduced-motion (#268).
  let enterOff = $state(false);
  const readEnter = () => {
    if (!host) return;
    enterOff = getComputedStyle(host).getPropertyValue('--ca-enter-scale').trim() === '0';
  };
  const stage = createStage({ isReduced: () => reducedMotion.value || enterOff });
  const ctx = stage.ctx;
  let host = $state<HTMLElement>();

  onMount(() => {
    const stopMedia = reducedMotion.init();
    stage.setHidden(document.hidden);
    const onVisibility = () => stage.setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) stage.setInView(e.isIntersecting && e.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.5, 1] }
    );
    if (host) io.observe(host);
    readEnter();
    // The theme can change at runtime (inline style, the theme stylesheet, a class on html).
    const mo = new MutationObserver(readEnter);
    mo.observe(document.documentElement, { attributes: true });
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      mo.disconnect();
      stopMedia();
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
    };
  });

  // One timer, alive only while playing: out of view, hidden, paused, taken over or reduced it is gone.
  $effect(() => {
    if (!ctx.playing) return;
    const id = setInterval(() => stage.tick(), loop);
    return () => clearInterval(id);
  });
</script>

<div
  class="ca-motion-stage"
  role="group"
  aria-label={label}
  bind:this={host}
  data-playing={ctx.playing}
  data-taken={stage.taken}
  data-reduced={ctx.reduced}
  data-cycle={ctx.cycle}
>
  <!-- Only the demo itself counts as a takeover; the Pause / Replay bar is the stage's own control. -->
  <div
    class="ca-motion-stage__canvas"
    role="presentation"
    onpointerdown={() => ctx.takeover()}
    onkeydown={() => ctx.takeover()}
    onfocusin={() => ctx.takeover()}
  >
    {@render children(ctx)}
  </div>
  <div class="ca-motion-stage__bar">
    {#if !ctx.reduced}
      <!-- Constant name, state in aria-pressed: pressed = autoplay is stopped. -->
      <Button size="sm" variant="ghost" aria-pressed={!ctx.playing} onclick={() => stage.toggle()}>
        {pauseLabel ?? t().motionStage.pause}
      </Button>
      {#if stage.taken}
        <Button size="sm" variant="outlined" onclick={() => ctx.play()}>
          {replayLabel ?? t().motionStage.replay}
        </Button>
      {/if}
    {/if}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-motion-stage {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
      inline-size: 100%;
      /* Fixed height: a card around the stage must not jump when the buttons appear. */
      min-block-size: 14rem;
    }
    .ca-motion-stage__canvas {
      display: grid;
      flex: 1;
      place-items: center;
      min-block-size: 10rem;
    }
    .ca-motion-stage__bar {
      display: flex;
      justify-content: flex-end;
      gap: var(--ca-space-2);
      min-block-size: var(--ca-space-10);
    }
}
</style>

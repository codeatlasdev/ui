<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';

  // A fixed pool of 14 dots: no node is created or destroyed while the pointer moves. Each dot
  // eases toward the one ahead of it (the head follows the pointer), so the chain draws the trail.
  const N = 14;
  let box = $state<HTMLElement>();
  let head = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let raf = 0;
  let stage = $state.raw<MotionCtx>();
  // Waking the loop when autoplay starts: an effect, never a write inside the template.
  $effect(() => {
    if (stage?.playing) wake();
  });
  let inView = true;
  let started = $state(false);
  const dots: HTMLElement[] = [];
  const pos = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
  const ids = Array.from({ length: N }, (_, i) => i);

  // Runs once per frame while something moves (per frame, 0.32 easing per dot).
  function frame(now: number) {
    raf = 0;
    if (stage?.playing && box) {
      // Autoplay: a lissajous path stands in for the pointer.
      const r = box.getBoundingClientRect();
      const k = now / 1000;
      target = { x: r.width / 2 + Math.cos(k * 2.1) * r.width * 0.34, y: r.height / 2 + Math.sin(k * 3.2) * r.height * 0.3 };
      if (!started) {
        for (const p of pos) Object.assign(p, target);
        started = true;
      }
    }
    let moving = false;
    let prev = target;
    for (let i = 0; i < N; i++) {
      const p = pos[i];
      p.x += (prev.x - p.x) * 0.32;
      p.y += (prev.y - p.y) * 0.32;
      if (Math.abs(prev.x - p.x) + Math.abs(prev.y - p.y) > 0.3) moving = true;
      dots[i].style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${1 - i / (N + 4)})`;
      prev = p;
    }
    if ((moving || stage?.playing) && inView) raf = requestAnimationFrame(frame);
  }
  function wake() {
    // Reduced motion renders no dots, so there is nothing to move: never start the loop.
    if (!raf && inView && !stage?.reduced) raf = requestAnimationFrame(frame);
  }
  function move(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    target = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!started) {
      // First move: snap the whole chain to the pointer so it does not fly in from the corner.
      for (const p of pos) Object.assign(p, target);
      started = true;
    }
    wake();
  }
  // The loop exists only while the demo is on screen.
  function watch(node: HTMLElement) {
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }
</script>

<MotionStage label="Cursor trail: a chain of dots eases after the pointer" loop={4000}>
  {#snippet children(m)}
    <div class="trail" role="presentation" bind:this={box} onpointermove={move} {@attach watch} {@attach () => { stage = m; }}>
      <div class="trail__copy">
        <p class="trail__title">Design review</p>
        <p class="trail__sub">Move the pointer to drag a trail</p>
      </div>
      {#if !m.reduced}
        {#each ids as i}
          <i class="trail__dot" class:trail__dot--on={started} bind:this={dots[i]} aria-hidden="true"></i>
        {/each}
      {/if}
    </div>
  {/snippet}
</MotionStage>

<style>
  .trail {
    position: relative;
    inline-size: 100%;
    max-inline-size: 34rem;
    block-size: 11rem;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-sunken);
    outline: 1px solid var(--ca-outline-subtle);
    touch-action: pan-y;
  }
  .trail__copy {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: var(--ca-space-1);
    text-align: center;
    pointer-events: none;
  }
  .trail__title { margin: 0; font-size: var(--ca-font-size-h4); font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); }
  .trail__sub { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .trail__dot {
    position: absolute;
    inset-block-start: -0.5rem;
    inset-inline-start: -0.5rem;
    inline-size: 1rem;
    block-size: 1rem;
    border-radius: 50%;
    background: var(--ca-brand-fill);
    opacity: 0;
    pointer-events: none;
  }
  .trail__dot--on { opacity: 0.55; }
  @media (pointer: coarse) {
    .trail { touch-action: none; }
  }
</style>

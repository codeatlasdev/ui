<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';
  import { ArrowRight } from '@lucide/svelte';
  import { Spring } from 'svelte/motion';

  const PULL = 0.35;
  const RANGE = 72;
  // Pull is a fraction of the pointer offset from the button centre, so it eases out at the edge.
  const pull = new Spring({ x: 0, y: 0 }, { stiffness: 0.12, damping: 0.55 });
  let zone = $state<HTMLElement>();
  let button = $state<HTMLElement>();
  let coarse = $state(false);
  // True once a real pointer is over the zone: the pull then belongs to it, not to the autoplay.
  let userHover = false;
  let ghost = $state({ x: -80, y: 70, visible: false });

  $effect(() => {
    const mq = matchMedia('(pointer: coarse)');
    const sync = () => (coarse = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  function aim(clientX: number, clientY: number) {
    if (!button || coarse) return;
    const r = button.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const near = Math.hypot(dx, dy) < RANGE + r.width / 2;
    pull.target = near ? { x: dx * PULL, y: dy * PULL } : { x: 0, y: 0 };
  }
  const release = () => (pull.target = { x: 0, y: 0 });

  // Autoplay: a fake cursor drifts in, the button leans toward it, then the cursor leaves and it springs back.
  function demoCycle(run: () => boolean) {
    const steps: [number, number, number][] = [
      [-70, 60, 0],
      [34, -20, 500],
      [48, 14, 1100],
      [-90, 70, 1800],
    ];
    const timers = steps.map(([x, y, at]) =>
      setTimeout(() => {
        if (!run()) return;
        ghost = { x, y, visible: true };
        if (x < -80) release();
        else pull.target = { x: x * PULL, y: y * PULL };
      }, at)
    );
    // Pause or out of view mid-lean: drop the pull, unless a real pointer already owns it.
    return () => {
      timers.forEach(clearTimeout);
      if (!userHover) release();
    };
  }
</script>

<MotionStage label="Magnetic button: the button leans toward the pointer and springs back" loop={2800}>
  {#snippet children(m)}
    {#key m.cycle}
      <div
        class="mag"
        bind:this={zone}
        role="presentation"
        onpointerenter={() => {
          userHover = true;
          m.takeover();
        }}
        onpointermove={(e) => aim(e.clientX, e.clientY)}
        onpointerleave={() => {
          userHover = false;
          release();
        }}
        {@attach (node) => {
          if (!m.playing || m.reduced) return;
          return demoCycle(() => m.playing);
        }}
      >
        <button
          type="button"
          class="mag__btn"
          bind:this={button}
          style="--mx:{m.reduced ? 0 : pull.current.x}px;--my:{m.reduced ? 0 : pull.current.y}px"
        >
          Start free trial <ArrowRight size={16} aria-hidden="true" />
        </button>
        {#if m.playing && ghost.visible}
          <span class="mag__ghost" aria-hidden="true" style="--gx:{ghost.x}px;--gy:{ghost.y}px"></span>
        {/if}
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .mag {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 100%;
    max-inline-size: 320px;
    min-block-size: 9rem;
  }
  .mag__btn {
    display: inline-flex;
    align-items: center;
    gap: var(--ca-space-2);
    min-block-size: var(--ca-touch-target);
    padding-inline: var(--ca-space-6);
    border: none;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font: inherit;
    font-weight: var(--ca-font-weight-semibold);
    cursor: pointer;
    box-shadow: var(--ca-shadow-md);
    transform: translate3d(var(--mx, 0), var(--my, 0), 0);
  }
  .mag__btn:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }
  .mag__ghost {
    position: absolute;
    inset-inline-start: 50%;
    inset-block-start: 50%;
    inline-size: var(--ca-space-4);
    block-size: var(--ca-space-4);
    margin: calc(var(--ca-space-2) * -1);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-text-primary);
    opacity: 0.55;
    pointer-events: none;
    transform: translate3d(var(--gx), var(--gy), 0);
    transition: transform 520ms cubic-bezier(0.2, 0, 0, 1);
  }
  @media (pointer: coarse) {
    .mag__btn {
      transform: none;
    }
    .mag__ghost {
      display: none;
    }
  }
</style>

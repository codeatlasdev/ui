<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';
  import { Spring } from 'svelte/motion';

  const MAX = 10;
  // Easing: spring. Duration: spring (no fixed time, it settles by physics).
  const tilt = new Spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.6 });
  let card = $state<HTMLElement>();
  let coarse = $state(false);
  // True once a real pointer is over the card: the tilt then belongs to it, not to the autoplay.
  let userHover = false;

  $effect(() => {
    const mq = matchMedia('(pointer: coarse)');
    const sync = () => (coarse = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  // Pointer position inside the card (-1..1) becomes rotateX/rotateY, at most 10deg.
  function aim(clientX: number, clientY: number) {
    if (!card || coarse) return;
    const r = card.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = ((clientY - r.top) / r.height) * 2 - 1;
    tilt.target = { x: -ny * MAX, y: nx * MAX };
  }
  const rest = () => (tilt.target = { x: 0, y: 0 });

  // Autoplay sweeps a fake pointer across the card corners, then lets it settle flat.
  const autoplay = (node: HTMLElement) => {
    const r = () => card?.getBoundingClientRect();
    const at = (fx: number, fy: number) => () => {
      const b = r();
      if (b) aim(b.left + b.width * fx, b.top + b.height * fy);
    };
    const timers = [
      setTimeout(at(0.1, 0.15), 300),
      setTimeout(at(0.9, 0.2), 900),
      setTimeout(at(0.8, 0.9), 1500),
      setTimeout(rest, 2100),
    ];
    return () => {
      timers.forEach(clearTimeout);
      if (!userHover) rest();
    };
  };
</script>

<MotionStage label="Tilt card: the card leans toward the pointer in 3D" loop={2800}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="tilt" {@attach (node) => (m.playing && !m.reduced ? autoplay(node) : undefined)}>
        <div
          class="tilt__card"
          bind:this={card}
          role="presentation"
          onpointerenter={() => {
            userHover = true;
            m.takeover();
          }}
          onpointermove={(e) => aim(e.clientX, e.clientY)}
          onpointerleave={() => {
            userHover = false;
            rest();
          }}
          style="--rx:{m.reduced ? 0 : tilt.current.x}deg;--ry:{m.reduced ? 0 : tilt.current.y}deg"
        >
          <p class="tilt__eyebrow">Monthly revenue</p>
          <p class="tilt__value">$48,290</p>
          <p class="tilt__delta">+12.4% vs last month</p>
        </div>
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .tilt {
    perspective: 700px;
    inline-size: 100%;
    max-inline-size: 280px;
  }
  .tilt__card {
    padding: var(--ca-space-6);
    border: var(--ca-border-width-thin) solid var(--ca-outline-default);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
    box-shadow: var(--ca-shadow-lg);
    transform: rotateX(var(--rx, 0)) rotateY(var(--ry, 0));
  }
  .tilt__card p {
    margin: 0;
  }
  .tilt__eyebrow {
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-caption);
  }
  .tilt__value {
    margin-block: var(--ca-space-1);
    font-size: var(--ca-font-size-h3);
    font-weight: var(--ca-font-weight-bold);
    font-variant-numeric: tabular-nums;
  }
  .tilt__delta {
    color: var(--ca-semantic-success);
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
  }
  @media (pointer: coarse) {
    .tilt__card {
      transform: none;
    }
  }
</style>

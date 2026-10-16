<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  const plans = [
    { name: 'Starter', price: '$0', unit: '/seat', note: '3 projects, community support' },
    { name: 'Team', price: '$24', unit: '/seat', note: 'Unlimited projects, SSO, audit log' },
    { name: 'Scale', price: '$96', unit: '/seat', note: 'Priority support, 99.99% uptime SLA' },
    { name: 'Enterprise', price: 'Custom', unit: '', note: 'Private cloud, dedicated engineer' }
  ];
  // Autoplay waypoints (x%, y%): one per cycle, the light eases between them.
  const waypoints = [
    [16, 26],
    [74, 22],
    [80, 76],
    [24, 72]
  ];

  // Pointer position in percent; null = follow the autoplay waypoint.
  let pointer = $state<{ x: number; y: number } | null>(null);

  function follow(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    pointer = {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100
    };
  }
</script>

<MotionStage label="Cursor spotlight: a soft light follows the pointer across a pricing grid" loop={1600}>
  {#snippet children(m)}
    {@const wp = waypoints[m.cycle % waypoints.length]}
    {@const at = pointer ?? { x: wp[0], y: wp[1] }}
    <div
      class="spot"
      class:spot--run={!m.reduced}
      role="presentation"
      style="--x:{m.reduced ? 50 : at.x}%; --y:{m.reduced ? 40 : at.y}%"
      onpointermove={follow}
      onpointerleave={() => (pointer = null)}
    >
      <ul class="spot__grid">
        {#each plans as p}
          <li class="spot__cell">
            <h3 class="spot__name">{p.name}</h3>
            <p class="spot__price">{p.price}<span>{p.unit}</span></p>
            <p class="spot__note">{p.note}</p>
          </li>
        {/each}
      </ul>
      <!-- Two layers share one radial mask: a brand glow, and a grid of lines that only shows inside it. -->
      <div class="spot__glow" aria-hidden="true"></div>
      <div class="spot__lines" aria-hidden="true"></div>
    </div>
  {/snippet}
</MotionStage>

<style>
  @property --x { syntax: '<percentage>'; inherits: true; initial-value: 50%; }
  @property --y { syntax: '<percentage>'; inherits: true; initial-value: 40%; }

  .spot {
    position: relative;
    inline-size: 100%;
    max-inline-size: 36rem;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-sunken);
    outline: 1px solid var(--ca-outline-subtle);
    touch-action: pan-y;
  }
  /* The eased follow: --x and --y are registered, so the browser interpolates them. */
  .spot--run {
    transition: --x 520ms cubic-bezier(0.2, 0, 0, 1), --y 520ms cubic-bezier(0.2, 0, 0, 1);
  }
  .spot__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 1px;
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--ca-outline-subtle);
  }
  .spot__cell { padding: var(--ca-space-4); background: var(--ca-surface-raised); }
  .spot__name { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .spot__price {
    margin: var(--ca-space-1) 0 0;
    font-size: var(--ca-font-size-h4);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
  }
  .spot__price span { margin-inline-start: var(--ca-space-1); font-size: var(--ca-font-size-caption); font-weight: var(--ca-font-weight-regular); color: var(--ca-text-hint); }
  .spot__note { margin: var(--ca-space-2) 0 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .spot__glow,
  .spot__lines { position: absolute; inset: 0; pointer-events: none; }
  .spot__glow {
    background: radial-gradient(circle 10rem at var(--x) var(--y), color-mix(in oklab, var(--ca-brand-fill) 22%, transparent), transparent 72%);
  }
  .spot__lines {
    background-image:
      linear-gradient(to right, var(--ca-brand-fill) 1px, transparent 1px),
      linear-gradient(to bottom, var(--ca-brand-fill) 1px, transparent 1px);
    background-size: 1.5rem 1.5rem;
    -webkit-mask-image: radial-gradient(circle 8rem at var(--x) var(--y), #000, transparent 72%);
    mask-image: radial-gradient(circle 8rem at var(--x) var(--y), #000, transparent 72%);
    opacity: 0.35;
  }
  @media (pointer: coarse) {
    .spot { touch-action: none; }
  }
</style>

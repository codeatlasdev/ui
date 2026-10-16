<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  const COLS = 14;
  const ROWS = 8;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS) }));
  // Autoplay origins (col, row): a new ripple starts from the next one every cycle.
  const origins = [
    [3, 2],
    [10, 5],
    [6, 1],
    [11, 2]
  ];

  // The ripple is one number pair; the key restarts the CSS animation on every click.
  let click = $state<{ c: number; r: number; n: number } | null>(null);

  function at(e: PointerEvent) {
    // Measure the dot grid itself, not the padded frame, so the cell under the pointer is exact.
    const grid = (e.currentTarget as HTMLElement).querySelector('.rip__grid');
    if (!grid) return;
    const r = grid.getBoundingClientRect();
    click = {
      c: Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * COLS))),
      r: Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * ROWS))),
      n: (click?.n ?? 0) + 1
    };
  }
</script>

<MotionStage label="Grid ripple: a wave of dots spreads from the point that was clicked" loop={2200}>
  {#snippet children(m)}
    {@const o = origins[m.cycle % origins.length]}
    {@const src = click ?? { c: o[0], r: o[1], n: m.cycle }}
    <div class="rip" role="presentation" onpointerdown={at}>
      <p class="rip__hint">Click anywhere on the grid</p>
      <!-- Keyed: a new click (or cycle) remounts the dots so every delay restarts from the new origin. -->
      {#key src.n}
        <div class="rip__grid" style="--cols:{COLS}" aria-hidden="true">
          {#each cells as d}
            {@const dist = Math.hypot(d.c - src.c, d.r - src.r)}
            <i class="rip__dot" class:rip__dot--run={!m.reduced} style="--d:{Math.round(dist * 70)}ms"></i>
          {/each}
        </div>
      {/key}
    </div>
  {/snippet}
</MotionStage>

<style>
  .rip {
    position: relative;
    inline-size: 100%;
    max-inline-size: 34rem;
    padding: var(--ca-space-4);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-sunken);
    outline: 1px solid var(--ca-outline-subtle);
    cursor: crosshair;
    touch-action: manipulation;
  }
  .rip__hint {
    margin: 0 0 var(--ca-space-3);
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    text-align: center;
  }
  .rip__grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: var(--ca-space-3);
    justify-items: center;
  }
  .rip__dot {
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-radius: 50%;
    background: var(--ca-outline-strong);
  }
  /* Each dot waits its distance from the origin (70ms per cell), swells, and settles back. */
  .rip__dot--run {
    animation: rip-wave 700ms cubic-bezier(0.2, 0, 0, 1) var(--d) both;
  }
  @keyframes rip-wave {
    0% { transform: scale(1); background: var(--ca-outline-strong); }
    35% { transform: scale(2.6); background: var(--ca-brand-fill); }
    100% { transform: scale(1); background: var(--ca-outline-strong); }
  }
</style>

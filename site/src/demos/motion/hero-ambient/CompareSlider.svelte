<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import { Spring } from 'svelte/motion';

  // The divider is a spring: it snaps to 25, 50 or 75 when released, and arrows step it by 10.
  const pos = new Spring(50, { stiffness: 0.14, damping: 0.62 });
  const snaps = [25, 50, 75];
  const stops = [22, 78, 50];
  let box: HTMLElement | undefined = $state();
  let dragging = false;
  // The stage context, captured once so autoplay can run in an effect (never write state in the template).
  let stage = $state.raw<MotionCtx>();
  $effect(() => {
    if (!stage?.playing || dragging) return;
    pos.target = stops[stage.cycle % stops.length];
  });

  function nearest(v: number) {
    return snaps.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  }
  function setFrom(clientX: number) {
    if (!box) return;
    const r = box.getBoundingClientRect();
    pos.set(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)), { instant: true });
  }
  function down(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFrom(e.clientX);
  }
  function move(e: PointerEvent) {
    if (dragging) setFrom(e.clientX);
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    pos.target = nearest(pos.target);
  }
  function key(e: KeyboardEvent) {
    const step = e.shiftKey ? 25 : 10;
    const next =
      e.key === 'ArrowLeft' ? pos.target - step
      : e.key === 'ArrowRight' ? pos.target + step
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 100
      : null;
    if (next === null) return;
    e.preventDefault();
    pos.target = Math.min(100, Math.max(0, next));
  }
</script>

<MotionStage label="Before and after compare: a divider with spring snap reveals the redesigned invoice" loop={2200}>
  {#snippet children(m)}
    <div
      class="cmp"
      bind:this={box}
      {@attach () => { stage = m; }}
      role="presentation"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
    >
      <!-- After sits underneath, before is clipped on top: the divider reveals one over the other. -->
      <div class="cmp__pane cmp__pane--after">
        <p class="cmp__tag">After</p>
        <p class="cmp__title">Invoice #4821</p>
        <p class="cmp__amount">$1,240.00</p>
        <p class="cmp__meta">Paid on Oct 12 by Ana Lima</p>
      </div>
      <div class="cmp__pane cmp__pane--before" style="--p:{m.reduced ? 50 : pos.current}%">
        <p class="cmp__tag">Before</p>
        <p class="cmp__title">INV-4821 / status: PAID</p>
        <p class="cmp__amount">1240</p>
        <p class="cmp__meta">usr=alima ts=1728691200</p>
      </div>
      <div
        class="cmp__handle"
        role="slider"
        tabindex="0"
        aria-label="Compare before and after"
        aria-orientation="horizontal"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(m.reduced ? 50 : pos.target)}
        aria-valuetext="{Math.round(m.reduced ? 50 : pos.target)}% before"
        style="--p:{m.reduced ? 50 : pos.current}%"
        onkeydown={key}
      >
        <span class="cmp__grip" aria-hidden="true"></span>
      </div>
    </div>
  {/snippet}
</MotionStage>

<style>
  .cmp {
    position: relative;
    inline-size: 100%;
    max-inline-size: 32rem;
    block-size: 11rem;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    outline: 1px solid var(--ca-outline-subtle);
    user-select: none;
    touch-action: pan-y;
    cursor: ew-resize;
  }
  .cmp__pane {
    position: absolute;
    inset: 0;
    padding: var(--ca-space-4) var(--ca-space-5);
    box-sizing: border-box;
    inline-size: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--ca-space-1);
  }
  .cmp__pane--after { background: var(--ca-surface-raised); color: var(--ca-text-primary); }
  .cmp__pane--before {
    background: var(--ca-surface-sunken);
    color: var(--ca-text-secondary);
    font-family: var(--ca-font-mono);
    clip-path: inset(0 calc(100% - var(--p)) 0 0);
  }
  .cmp__tag {
    margin: 0;
    align-self: flex-start;
    padding: 0 var(--ca-space-2);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-caption);
    font-family: var(--ca-font-sans);
  }
  .cmp__pane--before .cmp__tag { background: var(--ca-outline-strong); color: var(--ca-surface-raised); }
  .cmp__title { margin: 0; font-size: var(--ca-font-size-body2); overflow-wrap: anywhere; }
  .cmp__amount { margin: 0; font-size: var(--ca-font-size-h3); font-weight: var(--ca-font-weight-semibold); }
  .cmp__meta { margin: 0; font-size: var(--ca-font-size-caption); }
  .cmp__handle {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--p);
    inline-size: var(--ca-touch-target);
    min-block-size: var(--ca-touch-target);
    margin-inline-start: calc(var(--ca-touch-target) / -2);
    display: grid;
    place-items: center;
    cursor: ew-resize;
    outline: none;
  }
  .cmp__handle::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inline-size: 2px;
    background: var(--ca-brand-fill);
  }
  .cmp__grip {
    position: relative;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    border-radius: 50%;
    background: var(--ca-brand-fill);
    box-shadow: var(--ca-shadow-md);
  }
  .cmp__handle:focus-visible .cmp__grip { outline: var(--ca-border-width-focus) solid var(--ca-focus-ring); outline-offset: var(--ca-focus-ring-offset); }
  @media (pointer: coarse) {
    .cmp { touch-action: none; }
  }
</style>

<script lang="ts">
  import { Button, MotionStage, type MotionCtx } from '@codeatlasdev/ui';

  const target = 12480;
  const DURATION = 1400; // 1400ms count, eased out

  let n = $state(target);
  let raf = 0;

  /** easeOutExpo: fast start, long settle, so the last digits tick slowly into place. */
  const ease = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

  function run() {
    cancelAnimationFrame(raf);
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      n = Math.round(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    n = 0;
    raf = requestAnimationFrame(frame);
  }

  const autoplay = (m: MotionCtx) => () => {
    void m.cycle;
    if (m.reduced) {
      n = target;
      return;
    }
    run();
    return () => cancelAnimationFrame(raf);
  };
</script>

<MotionStage label="Count up: a number counts from zero and eases into its total" loop={3200}>
  {#snippet children(m)}
    <div class="cu" {@attach autoplay(m)}>
      <p class="cu__label">Active customers</p>
      <!-- The final number is the accessible value; the counting digits are decoration. -->
      <p class="cu__value" role="img" aria-label={`${target.toLocaleString('en-US')} active customers`}>
        <span aria-hidden="true">{n.toLocaleString('en-US')}</span>
      </p>
      <p class="cu__delta">+18.4% since last quarter</p>
      <Button size="sm" variant="outlined" onclick={() => !m.reduced && run()}>Count again</Button>
    </div>
  {/snippet}
</MotionStage>

<style>
  .cu { display: grid; gap: var(--ca-space-2); justify-items: start; }
  .cu__label { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .cu__value {
    margin: 0;
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-display-2);
    font-weight: var(--ca-font-weight-heading);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ca-text-primary);
  }
  .cu__delta { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-brand-text); }
</style>

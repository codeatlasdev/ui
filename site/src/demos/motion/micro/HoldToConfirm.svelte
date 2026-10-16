<script lang="ts">
  import { MotionStage, announce } from '@codeatlasdev/ui';
  import { Trash2, Check } from '@lucide/svelte';

  const uid = $props.id();
  // 1200ms hold, linear: progress is time / HOLD, so the ring fills at a constant rate.
  const HOLD = 1200;
  const R = 22;
  const C = 2 * Math.PI * R;

  let progress = $state(0);
  let done = $state(false);
  let holding = false;
  let raf = 0;
  let start = 0;

  function frame(now: number) {
    progress = Math.min(1, (now - start) / HOLD);
    if (progress >= 1) {
      holding = false;
      done = true;
      announce('Project deleted');
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function begin() {
    if (holding || done) return;
    holding = true;
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }
  // Releasing early cancels: the ring drains back to 0.
  function cancel() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(raf);
    progress = 0;
  }
  function reset() {
    cancel();
    done = false;
    progress = 0;
  }

  // Autoplay holds for the full duration, shows the result, then resets on the next cycle.
  const autoplay = (node: HTMLElement) => {
    reset();
    const t1 = setTimeout(begin, 400);
    return () => {
      clearTimeout(t1);
      reset();
    };
  };
</script>

<MotionStage label="Hold to confirm: press and hold to delete, release early to cancel" loop={3400}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="hold" {@attach (node) => (m.playing && !m.reduced ? autoplay(node) : undefined)}>
        <button
          type="button"
          class="hold__btn"
          class:hold__btn--done={done}
          aria-describedby="{uid}-hint"
          onpointerdown={begin}
          onpointerup={cancel}
          onpointerleave={cancel}
          onpointercancel={cancel}
          onkeydown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              begin();
            }
          }}
          onkeyup={(e) => (e.key === ' ' || e.key === 'Enter') && cancel()}
          onblur={cancel}
        >
          <svg class="hold__ring" viewBox="0 0 52 52" aria-hidden="true">
            <circle class="hold__track" cx="26" cy="26" r={R} />
            <circle
              class="hold__bar"
              cx="26"
              cy="26"
              r={R}
              stroke-dasharray={C}
              stroke-dashoffset={C * (1 - (m.reduced && !done ? 0 : progress))}
            />
          </svg>
          {#if done}<Check size={20} aria-hidden="true" />{:else}<Trash2 size={20} aria-hidden="true" />{/if}
          <span class="ca-sr-only">{done ? 'Deleted' : 'Delete project'}</span>
        </button>
        <p class="hold__text" id="{uid}-hint">
          {done ? 'Project deleted' : 'Hold 1.2 seconds to delete “Q3 roadmap”'}
        </p>
        {#if done}
          <button type="button" class="hold__undo" onclick={reset}>Undo</button>
        {/if}
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .hold {
    display: grid;
    justify-items: center;
    gap: var(--ca-space-3);
    max-inline-size: 280px;
    text-align: center;
  }
  .hold__btn {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 64px;
    block-size: 64px;
    padding: 0;
    border: none;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-surface-raised);
    box-shadow: var(--ca-shadow-md);
    color: var(--ca-semantic-error);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  .hold__btn--done {
    color: var(--ca-semantic-success);
  }
  .hold__btn:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }
  .hold__ring {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    transform: rotate(-90deg);
    fill: none;
    stroke-width: 3;
  }
  .hold__track {
    stroke: var(--ca-outline-subtle);
  }
  .hold__bar {
    stroke: currentColor;
    stroke-linecap: round;
  }
  .hold__text {
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
  .hold__undo {
    min-block-size: var(--ca-touch-target);
    padding-inline: var(--ca-space-4);
    border: none;
    background: none;
    color: var(--ca-brand-text);
    font: inherit;
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
  }
</style>

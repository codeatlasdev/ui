<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';

  const target = 'ENCRYPTED  →  DECRYPTED';
  const glyphs = '!<>-_\\/[]{}=+*^?#0123456789';
  const STEP = 40; // 40ms: how often the random glyphs are redrawn
  const SETTLE = 55; // 55ms per letter, linear: a constant pace with no easing

  let text = $state(target);
  let raf = 0;

  /** Decode left to right: letters before the cursor are final, the rest are random glyphs. */
  function decode() {
    cancelAnimationFrame(raf);
    const start = performance.now();
    let last = -STEP;
    const frame = (now: number) => {
      const t = now - start;
      if (now - last >= STEP) {
        last = now;
        const locked = Math.floor(t / SETTLE);
        text = [...target]
          .map((c, i) => (c === ' ' || i < locked ? c : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join('');
      }
      if (t / SETTLE < target.length) raf = requestAnimationFrame(frame);
      else text = target;
    };
    raf = requestAnimationFrame(frame);
  }

  /** Autoplay: every stage cycle decodes again; reduced motion shows the final text. */
  const autoplay = (m: MotionCtx) => () => {
    const { cycle, reduced } = m;
    void cycle;
    if (reduced) {
      cancelAnimationFrame(raf);
      text = target;
      return;
    }
    decode();
    return () => cancelAnimationFrame(raf);
  };
</script>

<MotionStage label="Scramble: a line of text decodes from random glyphs" loop={2800}>
  {#snippet children(m)}
    <div class="scramble" {@attach autoplay(m)}>
      <!-- The stable sentence is the accessible name; the flickering glyphs are decoration. -->
      <button
        type="button"
        class="scramble__btn"
        aria-label={target}
        onpointerenter={() => !m.reduced && decode()}
        onfocus={() => !m.reduced && decode()}
      >
        <span aria-hidden="true" class="scramble__text">{text}</span>
      </button>
      <p class="scramble__hint">Hover or focus the line to decode it again.</p>
    </div>
  {/snippet}
</MotionStage>

<style>
  .scramble { display: grid; gap: var(--ca-space-3); justify-items: start; }
  .scramble__btn {
    all: unset;
    cursor: pointer;
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-sunken);
    color: var(--ca-brand-text);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-lg);
    font-weight: var(--ca-font-weight-semibold);
    letter-spacing: 0.04em;
    white-space: pre;
  }
  .scramble__btn:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
  .scramble__text { display: inline-block; min-inline-size: 23ch; }
  .scramble__hint { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

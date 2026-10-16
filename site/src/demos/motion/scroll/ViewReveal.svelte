<script lang="ts">
  import { Card, MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import type { Attachment } from 'svelte/attachments';

  const native = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

  const tiles = [
    { k: 'Conversion', v: '4.8%', d: '+0.6 pt' },
    { k: 'Avg. order', v: '$64.20', d: '+$3.10' },
    { k: 'Returning', v: '37%', d: '+5 pt' },
    { k: 'Refund rate', v: '1.2%', d: '-0.3 pt' },
    { k: 'Page speed', v: '1.4 s', d: '-0.5 s' }
  ];

  // Fallback for browsers without `animation-timeline: view()`: each tile's progress through the
  // container (0 = just entering at the bottom, 1 = settled) is written to its own --v on scroll.
  const fallback = (m: MotionCtx): Attachment<HTMLElement> => (root) => {
    if (native || m.reduced) return;
    const items = [...root.querySelectorAll<HTMLElement>('[data-tile]')];
    const write = () => {
      const r = root.getBoundingClientRect();
      for (const el of items) {
        const t = el.getBoundingClientRect();
        const v = (r.bottom - t.top) / (t.height * 1.6);
        el.style.setProperty('--v', String(Math.min(1, Math.max(0, v))));
      }
    };
    write();
    root.addEventListener('scroll', write, { passive: true });
    return () => root.removeEventListener('scroll', write);
  };

  // Autoplay = scroll down in 2800ms (ease-in-out) once per cycle; wheel or touch = takeover.
  const drive = (m: MotionCtx): Attachment<HTMLElement> => (el) => {
    const stop = () => m.takeover();
    el.addEventListener('wheel', stop, { passive: true });
    el.addEventListener('touchmove', stop, { passive: true });
    let raf = 0;
    if (m.playing) {
      void m.cycle;
      el.scrollTop = 0;
      const to = el.scrollHeight - el.clientHeight;
      const t0 = performance.now();
      const step = (now: number) => {
        if (!m.playing) return; // taken over or paused: never write a frame after the user starts scrolling
        const t = Math.min(1, (now - t0) / 2800);
        el.scrollTop = to * (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchmove', stop);
    };
  };
</script>

<MotionStage label="View timeline reveal: each tile fades and scales in as it enters the scroll area" loop={4600}>
  {#snippet children(m)}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="vt"
      class:vt--native={native}
      class:vt--final={m.reduced}
      role="region"
      aria-label="Store metrics"
      tabindex="0"
      {@attach fallback(m)}
      {@attach drive(m)}
    >
      {#each tiles as t (t.k)}
        <div class="vt__tile" data-tile>
          <Card>
            <p class="vt__k">{t.k}</p>
            <p class="vt__v">{t.v} <span class="vt__d">{t.d}</span></p>
          </Card>
        </div>
      {/each}
    </div>
  {/snippet}
</MotionStage>

<style>
  .vt {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-3);
    inline-size: 100%;
    max-inline-size: 360px;
    block-size: 13rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--ca-space-2);
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .vt__tile {
    --v: 1;
    flex: none;
    opacity: var(--v);
    transform: translateY(calc((1 - var(--v)) * 28px)) scale(calc(0.92 + var(--v) * 0.08));
  }
  .vt--final .vt__tile { opacity: 1; transform: none; }
  .vt__k { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); letter-spacing: 0.06em; text-transform: uppercase; }
  .vt__v { margin: var(--ca-space-1) 0 0; font-size: var(--ca-font-size-h6); font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); font-variant-numeric: tabular-nums; }
  .vt__d { margin-inline-start: var(--ca-space-2); font-size: var(--ca-font-size-caption); color: var(--ca-semantic-success); }

  @supports (animation-timeline: view()) {
    .vt--native:not(.vt--final) .vt__tile {
      animation-name: view-in;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-duration: 1ms;
      animation-timeline: view(block);
      animation-range: entry 0% entry 70%;
    }
    @keyframes view-in {
      from { opacity: 0; transform: translateY(28px) scale(0.92); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  }
</style>

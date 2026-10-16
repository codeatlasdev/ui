<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import type { Attachment } from 'svelte/attachments';

  const steps = [
    { title: 'Connect your bank', body: 'Read-only access through your bank. We never see your password.', figure: '3 min', note: 'Average setup' },
    { title: 'We sort every transaction', body: 'Rules and a model tag each payment. You only review the odd ones.', figure: '94%', note: 'Auto-categorized' },
    { title: 'See the month at a glance', body: 'Spending, recurring bills and what is left before payday.', figure: '$1,284', note: 'Left this month' }
  ];

  let active = $state(0);

  // Active step = the step block crossing the middle of the container (IntersectionObserver, root = scroller).
  const watch: Attachment<HTMLElement> = (root) => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = Number((e.target as HTMLElement).dataset.step);
      },
      { root, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    root.querySelectorAll('[data-step]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  };

  // Autoplay = scroll down in 3600ms (ease-in-out) so each step takes the pin in turn; wheel or touch = takeover.
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
        const t = Math.min(1, (now - t0) / 3600);
        el.scrollTop = to * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
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

<MotionStage label="Pinned step story: the media stays put and changes as each step scrolls past" loop={5600}>
  {#snippet children(m)}
    {@const cur = m.reduced ? steps.length - 1 : active}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="story" role="region" aria-label="How it works, three steps" tabindex="0" {@attach watch} {@attach drive(m)}>
      <div class="story__media" aria-hidden="true">
        {#each steps as s, i (s.title)}
          <div class="story__fig" class:story__fig--on={i === cur}>
            <span class="story__num">{s.figure}</span>
            <span class="story__note">{s.note}</span>
          </div>
        {/each}
        <div class="story__dots">
          {#each steps as s, i (s.title)}<span class="story__dot" class:story__dot--on={i === cur}></span>{/each}
        </div>
      </div>
      <ol class="story__steps">
        {#each steps as s, i (s.title)}
          <li class="story__step" class:story__step--on={i === cur} data-step={i}>
            <p class="story__title">{s.title}</p>
            <p class="story__body">{s.body}</p>
          </li>
        {/each}
      </ol>
    </div>
  {/snippet}
</MotionStage>

<style>
  .story {
    display: grid;
    grid-template-columns: 9rem 1fr;
    align-items: start;
    inline-size: 100%;
    max-inline-size: 420px;
    block-size: 13rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .story__media {
    position: sticky;
    inset-block-start: 0;
    display: grid;
    place-items: center;
    block-size: 13rem;
    background: color-mix(in oklab, var(--ca-brand-main) 10%, transparent);
  }
  .story__fig {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ca-space-1);
    opacity: 0;
    transform: translateY(12px) scale(0.96);
    transition: opacity 320ms cubic-bezier(0.2, 0, 0, 1), transform 320ms cubic-bezier(0.2, 0, 0, 1);
  }
  .story__fig--on { opacity: 1; transform: none; }
  .story__num { font-size: var(--ca-font-size-h3); font-weight: var(--ca-font-weight-semibold); color: var(--ca-brand-text); font-variant-numeric: tabular-nums; }
  .story__note { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .story__dots { position: absolute; inset-block-end: var(--ca-space-3); display: flex; gap: var(--ca-space-1); }
  .story__dot { inline-size: 6px; block-size: 6px; border-radius: 50%; background: var(--ca-outline-default); transition: background 320ms; }
  .story__dot--on { background: var(--ca-brand-main); }
  .story__steps { margin: 0; padding: 0; list-style: none; }
  .story__step {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--ca-space-1);
    block-size: 13rem;
    padding: 0 var(--ca-space-4);
    opacity: 0.4;
    transition: opacity 320ms cubic-bezier(0.2, 0, 0, 1);
  }
  .story__step--on { opacity: 1; }
  .story__title { margin: 0; font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); }
  .story__body { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

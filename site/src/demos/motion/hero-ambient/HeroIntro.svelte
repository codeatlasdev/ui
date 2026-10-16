<script lang="ts">
  import { Button, MotionStage } from '@codeatlasdev/ui';
</script>

<MotionStage label="Hero intro: eyebrow, headline, copy and buttons enter one after another" loop={4200}>
  {#snippet children(m)}
    <!-- Keyed on the cycle: a new cycle mounts fresh nodes, so every delay restarts. The static
         first frame (server HTML, reduced motion) is the finished layout: nothing starts hidden. -->
    {#key m.cycle}
      <section class="intro" class:intro--run={m.playing && m.cycle > 0}>
        <p class="intro__eyebrow" style="--i:0">New in 4.2</p>
        <h3 class="intro__title" style="--i:1">Ship the dashboard your team asked for</h3>
        <p class="intro__lead" style="--i:2">Pick a page, hand the number to your AI, review the pull request.</p>
        <div class="intro__cta" style="--i:3">
          <Button>Open the gallery</Button>
          <Button variant="outlined">Read the docs</Button>
        </div>
      </section>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .intro { display: grid; gap: var(--ca-space-3); justify-items: start; inline-size: 100%; max-inline-size: 30rem; }
  .intro > * { margin: 0; }
  .intro__eyebrow {
    padding: 0 var(--ca-space-3);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-size: var(--ca-font-size-caption);
  }
  .intro__title { font-size: var(--ca-font-size-h2); line-height: 1.15; font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); text-wrap: balance; }
  .intro__lead { color: var(--ca-text-secondary); font-size: var(--ca-font-size-body1); }
  .intro__cta { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
  /* Each child waits 90ms times its position (--i), then rises 14px and fades in. `both` holds the
     hidden first keyframe during the delay, so only a running intro ever hides anything. */
  .intro--run > * {
    animation: intro-in 520ms cubic-bezier(0.2, 0, 0, 1) calc(var(--i) * 90ms) both;
  }
  @keyframes intro-in {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>

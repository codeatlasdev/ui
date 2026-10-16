<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  // Takeover: the pointer (or arrow keys on the focused heading) steers the highlight, 0-100%.
  let x = $state(50);
  function onMove(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') x = Math.min(100, x + 10);
    else if (e.key === 'ArrowLeft') x = Math.max(0, x - 10);
  }
</script>

<MotionStage label="Shine sweep: a highlight glides across a gradient heading" loop={3200}>
  {#snippet children(m)}
    <div class="shine">
      <h3 class="shine__heading">
        <button
          type="button"
          class="shine__title"
          class:shine__title--run={m.playing && !m.reduced}
          class:shine__title--manual={!m.playing && !m.reduced}
          style="--x:{x}%"
          onpointermove={onMove}
          onkeydown={onKey}
        >
          Ship the quarter, not the spreadsheet
        </button>
      </h3>
      <p class="shine__hint">Move the pointer, or focus the heading and use the arrow keys.</p>
    </div>
  {/snippet}
</MotionStage>

<style>
  .shine { display: grid; gap: var(--ca-space-3); max-width: 28rem; }
  .shine__heading { margin: 0; }
  .shine__title {
    all: unset;
    display: block;
    cursor: pointer;
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-h2);
    font-weight: var(--ca-font-weight-heading);
    line-height: 1.1;
    /* Base color stays in the gradient's outer stops: the highlight is the light band over it. */
    background-image: linear-gradient(
      100deg,
      var(--ca-brand-text) 0%,
      var(--ca-brand-text) 38%,
      var(--ca-text-primary) 50%,
      var(--ca-brand-text) 62%,
      var(--ca-brand-text) 100%
    );
    background-size: 250% 100%;
    background-position: 100% 0;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    outline-offset: 6px;
    box-sizing: border-box;
  }
  .shine__title:focus-visible { outline: 2px solid var(--ca-focus-ring); border-radius: var(--ca-radius-sm); }
  .shine__title--run { animation: shine-sweep 2200ms cubic-bezier(0.4, 0, 0.2, 1) both; }
  .shine__title--manual { background-position: var(--x) 0; }
  .shine__hint { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  @keyframes shine-sweep {
    from { background-position: 100% 0; }
    to { background-position: 0% 0; }
  }
  @media (forced-colors: active) {
    .shine__title { background: none; color: CanvasText; -webkit-text-fill-color: currentColor; }
  }
</style>

<script lang="ts">
  import { Button, MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import { Spring } from 'svelte/motion';

  // The sheet's offset from its resting place, in px of the stage: 0 = open, SHEET = fully hidden.
  const SHEET = 256;
  const offset = new Spring(SHEET, { stiffness: 0.2, damping: 0.75 });
  let open = $state(false);
  let dragging = $state(false);
  let stage = $state<MotionCtx>();
  let lastCycle = -1;
  let startY = 0;
  let startOffset = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  // The offset as dragged: the Spring only advances on the next frame, so release reads this.
  let dragged = 0;

  function setOpen(next: boolean) {
    open = next;
    if (stage?.reduced) offset.set(next ? 0 : SHEET, { instant: true });
    else offset.target = next ? 0 : SHEET;
  }

  function down(e: PointerEvent) {
    if (!e.isPrimary || !open) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging = true;
    startY = lastY = e.clientY;
    startOffset = dragged = offset.current;
    lastT = e.timeStamp;
    velocity = 0;
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = (e.clientY - lastY) / dt;
    lastY = e.clientY;
    lastT = e.timeStamp;
    // Dragging up resists (rubber band), dragging down follows the finger 1:1.
    const raw = startOffset + (e.clientY - startY);
    dragged = raw < 0 ? raw / 4 : Math.min(SHEET, raw);
    offset.set(dragged, { instant: true });
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    // Past 30% of the height, or a fast flick (> 0.5 px/ms), dismisses; otherwise it springs back.
    setOpen(!(dragged > SHEET * 0.3 || velocity > 0.5));
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) setOpen(false);
  }

  $effect(() => {
    if (!stage) return;
    if (stage.reduced) {
      setOpen(true);
      return;
    }
    if (!stage.playing || stage.cycle === lastCycle) return;
    lastCycle = stage.cycle;
    setOpen(!open);
  });
</script>

<MotionStage label="Sheet spring: a bottom sheet springs up and drags down to dismiss" loop={2600}>
  {#snippet children(m)}
    <div class="sh" role="presentation" {@attach () => { stage = m; }} onkeydown={key}>
      <div class="sh__page">
        <p class="sh__title">Trip to Lisbon</p>
        <p class="sh__sub">3 travelers, 12-19 Nov</p>
        <Button onclick={() => setOpen(true)}>Choose seats</Button>
      </div>
      <div class="sh__scrim" style="--o:{1 - Math.min(1, Math.max(0, offset.current) / SHEET)}"></div>
      <div class="sh__sheet" inert={!open} role="dialog" aria-label="Choose seats" style="--y:{offset.current}px">
        <div class="sh__grab" role="presentation" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
          <span class="sh__handle" aria-hidden="true"></span>
          <p class="sh__sheet-title">Choose seats</p>
        </div>
        <ul class="sh__seats">
          <li><span>14A Window</span><span>R$ 0</span></li>
          <li><span>14B Middle</span><span>R$ 0</span></li>
          <li><span>3C Aisle, extra legroom</span><span>R$ 89</span></li>
        </ul>
        <Button variant="outlined" onclick={() => setOpen(false)}>Done</Button>
      </div>
    </div>
  {/snippet}
</MotionStage>

<style>
  .sh {
    position: relative; overflow: hidden; inline-size: 100%; max-inline-size: 340px; block-size: calc(10rem + 256px);
    background: var(--ca-surface-raised); border: var(--ca-border-width) solid var(--ca-outline-subtle); border-radius: var(--ca-radius-lg);
  }
  .sh__page { display: grid; gap: var(--ca-space-1); justify-items: start; align-content: start; block-size: 10rem; padding: var(--ca-space-4); }
  .sh__title { margin: 0; font-weight: var(--ca-font-weight-semibold); font-size: var(--ca-font-size-h6); }
  .sh__sub { margin: 0 0 var(--ca-space-2); color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .sh__scrim { position: absolute; inset: 0; background: var(--ca-scrim-color); opacity: calc(var(--o) * 0.5); pointer-events: none; }
  .sh__sheet {
    position: absolute; inset-inline: 0; inset-block-end: 0; display: grid; gap: var(--ca-space-3); justify-items: start;
    padding: 0 var(--ca-space-4) var(--ca-space-4); background: var(--ca-surface-overlay);
    border-top: var(--ca-border-width) solid var(--ca-outline-subtle); border-radius: var(--ca-radius-xl) var(--ca-radius-xl) 0 0;
    box-shadow: var(--ca-shadow-xl); transform: translateY(var(--y));
  }
  .sh__grab { inline-size: calc(100% + 2 * var(--ca-space-4)); margin-inline: calc(-1 * var(--ca-space-4)); padding: var(--ca-space-2) var(--ca-space-4) 0; touch-action: none; cursor: grab; user-select: none; }
  .sh__handle { display: block; inline-size: var(--ca-space-10); block-size: var(--ca-space-1); margin: 0 auto var(--ca-space-2); border-radius: var(--ca-radius-pill); background: var(--ca-outline-strong); }
  .sh__sheet-title { margin: 0; font-weight: var(--ca-font-weight-semibold); }
  .sh__seats { inline-size: 100%; margin: 0; padding: 0; list-style: none; display: grid; gap: var(--ca-space-1); font-size: var(--ca-font-size-body2); }
  .sh__seats li { display: flex; justify-content: space-between; padding: var(--ca-space-1) 0; border-block-end: var(--ca-border-width) solid var(--ca-outline-subtle); }
</style>

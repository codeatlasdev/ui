<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  const uid = $props.id();
  let on = $state(false);
  let pressed = $state(false);

  const flip = (node: HTMLElement) => {
    on = false;
    const t0 = setTimeout(() => (pressed = true), 500);
    const t1 = setTimeout(() => {
      pressed = false;
      on = true;
    }, 640);
    const t2 = setTimeout(() => (on = false), 1700);
    return () => {
      [t0, t1, t2].forEach(clearTimeout);
      pressed = false;
    };
  };
</script>

<MotionStage label="Spring switch: the thumb stretches on press and overshoots into place" loop={2800}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="sw" {@attach (node) => (m.playing && !m.reduced ? flip(node) : undefined)}>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="{uid}-label"
          class="sw__track"
          class:sw__track--on={on}
          class:sw__track--press={pressed}
          class:sw__track--still={m.reduced}
          onclick={() => (on = !on)}
          onpointerdown={() => (pressed = true)}
          onpointerup={() => (pressed = false)}
          onpointerleave={() => (pressed = false)}
        >
          <span class="sw__thumb"></span>
        </button>
        <span class="sw__label" id="{uid}-label">Push notifications</span>
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .sw {
    display: flex;
    align-items: center;
    gap: var(--ca-space-3);
  }
  /* The button is the 44px hit area; the visible 52x32 track is its ::before. */
  .sw__track {
    position: relative;
    flex: none;
    inline-size: 52px;
    block-size: var(--ca-touch-target);
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  .sw__track::before {
    content: '';
    position: absolute;
    inset-block: 6px;
    inset-inline: 0;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-outline-default);
    transition: background 240ms cubic-bezier(0.2, 0, 0, 1);
  }
  .sw__track--on::before {
    background: var(--ca-brand-fill);
  }
  .sw__track:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }
  .sw__thumb {
    position: absolute;
    inset-block-start: 10px;
    inset-inline-start: 4px;
    inline-size: 24px;
    block-size: 24px;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-surface-raised);
    box-shadow: var(--ca-shadow-sm);
    transform-origin: left center;
    transition: transform 420ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .sw__track--on .sw__thumb {
    transform: translateX(20px);
  }
  .sw__track--press .sw__thumb {
    transform: scaleX(1.3);
  }
  .sw__track--on.sw__track--press .sw__thumb {
    transform: translateX(14px) scaleX(1.3);
  }
  .sw__track--still::before,
  .sw__track--still .sw__thumb {
    transition: none;
  }
  .sw__label {
    font-size: var(--ca-font-size-body2);
  }
</style>

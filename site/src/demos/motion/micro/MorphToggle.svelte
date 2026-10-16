<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  const uid = $props.id();
  let dark = $state(false);

  // Autoplay flips the switch once per cycle.
  const flip = (node: HTMLElement) => {
    const t = setTimeout(() => (dark = !dark), 700);
    return () => clearTimeout(t);
  };
</script>

<MotionStage label="Morphing toggle: a sun morphs into a moon" loop={2400}>
  {#snippet children(m)}
    {#key m.cycle}
      <div class="tg" {@attach (node) => (m.playing && !m.reduced ? flip(node) : undefined)}>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Dark mode"
          class="tg__btn"
          class:tg__btn--dark={dark}
          class:tg__btn--still={m.reduced}
          onclick={() => (dark = !dark)}
        >
          <svg viewBox="0 0 24 24" class="tg__icon" aria-hidden="true">
            <!-- The sun's disc: a mask circle slides in and bites it into a crescent. -->
            <mask id="{uid}-bite">
              <rect width="24" height="24" fill="white" />
              <circle class="tg__bite" cx="17" cy="7" r="7" fill="black" />
            </mask>
            <circle class="tg__disc" cx="12" cy="12" r="6" mask={`url(#${uid}-bite)`} />
            <g class="tg__rays">
              {#each [0, 45, 90, 135, 180, 225, 270, 315] as a}
                <line x1="12" y1="2" x2="12" y2="4.5" transform="rotate({a} 12 12)" />
              {/each}
            </g>
          </svg>
        </button>
        <p class="tg__label">{dark ? 'Dark' : 'Light'} appearance</p>
      </div>
    {/key}
  {/snippet}
</MotionStage>

<style>
  .tg {
    display: grid;
    justify-items: center;
    gap: var(--ca-space-3);
  }
  .tg__btn {
    display: grid;
    place-items: center;
    inline-size: var(--ca-touch-target);
    block-size: var(--ca-touch-target);
    padding: 0;
    border: var(--ca-border-width-thin) solid var(--ca-outline-default);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-surface-raised);
    color: var(--ca-text-primary);
    cursor: pointer;
    transition: background 280ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tg__btn--dark {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }
  .tg__btn:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }
  .tg__icon {
    inline-size: 26px;
    block-size: 26px;
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    transition: transform 420ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tg__disc {
    stroke: none;
  }
  .tg__rays {
    transform-origin: 12px 12px;
    transition:
      transform 420ms cubic-bezier(0.2, 0, 0, 1),
      opacity 280ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tg__bite {
    transform: translate(10px, -10px);
    transition: transform 420ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tg__btn--dark .tg__icon {
    transform: rotate(-35deg);
  }
  .tg__btn--dark .tg__bite {
    transform: translate(0, 0);
  }
  .tg__btn--dark .tg__rays {
    transform: rotate(45deg) scale(0.4);
    opacity: 0;
  }
  .tg__btn--still,
  .tg__btn--still .tg__icon,
  .tg__btn--still .tg__bite,
  .tg__btn--still .tg__rays {
    transition: none;
  }
  .tg__label {
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>

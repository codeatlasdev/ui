<script lang="ts">
  import { MotionStage } from '@codeatlasdev/ui';

  // Takeover: the pointer paints the field. x picks the hue turn, y the gradient angle.
  let hue = $state(0);
  let angle = $state(135);
  let driven = $state(false);

  function paint(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hue = Math.round(((e.clientX - r.left) / r.width) * 90);
    angle = Math.round(((e.clientY - r.top) / r.height) * 360);
    driven = true;
  }
</script>

<MotionStage label="Animated gradient field: a mesh of brand color slowly shifts hue and angle" loop={6000}>
  {#snippet children(m)}
    <div
      class="field"
      class:field--run={m.playing && !driven}
      role="presentation"
      style={driven ? `--hue:${hue}; --angle:${angle}deg` : undefined}
      onpointermove={paint}
    >
      <div class="field__copy">
        <p class="field__eyebrow">Q3 revenue</p>
        <p class="field__value">$2.48M</p>
        <p class="field__delta">+18.4% vs last quarter</p>
      </div>
    </div>
  {/snippet}
</MotionStage>

<style>
  /* Registered custom properties: the browser can interpolate an angle and a hue number, a plain var cannot. */
  @property --hue { syntax: '<number>'; inherits: true; initial-value: 0; }
  @property --angle { syntax: '<angle>'; inherits: true; initial-value: 135deg; }

  .field {
    display: grid;
    align-items: end;
    inline-size: 100%;
    max-inline-size: 34rem;
    aspect-ratio: 16 / 9;
    padding: var(--ca-space-5);
    border-radius: var(--ca-radius-lg);
    outline: 1px solid var(--ca-outline-subtle);
    /* The hue turn shifts each stop around the brand color; oklab mixing keeps the blend clean. */
    background:
      radial-gradient(circle at 20% 15%, color-mix(in oklch, var(--ca-brand-fill), var(--ca-semantic-info) calc(var(--hue) * 1%)) 0%, transparent 55%),
      radial-gradient(circle at 85% 80%, color-mix(in oklch, var(--ca-brand-light), var(--ca-semantic-secondary) calc(var(--hue) * 1%)) 0%, transparent 60%),
      linear-gradient(var(--angle), var(--ca-surface-sunken), var(--ca-surface-raised));
    touch-action: pan-y;
  }
  .field--run { animation: field-drift 9s ease-in-out infinite alternate; }
  @keyframes field-drift {
    from { --hue: 0; --angle: 135deg; }
    to { --hue: 90; --angle: 315deg; }
  }
  .field__copy { color: var(--ca-text-primary); }
  .field__eyebrow { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .field__value { margin: var(--ca-space-1) 0 0; font-size: var(--ca-font-size-h2); font-weight: var(--ca-font-weight-semibold); }
  .field__delta { margin: var(--ca-space-1) 0 0; font-size: var(--ca-font-size-body2); color: var(--ca-semantic-success); }
  @media (pointer: coarse) {
    .field { touch-action: none; }
  }
</style>

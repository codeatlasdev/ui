<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';

  const values = [48210, 51904, 49377, 56012];
  const digits = '0123456789'.split('');

  let value = $state(values[0]);
  let typed = $state('48210');

  /** Autoplay walks through the KPI values only while playing; reduced motion pins the last one. */
  const autoplay = (m: MotionCtx) => () => {
    const { cycle, reduced, playing } = m;
    if (reduced) value = values[values.length - 1];
    else if (playing) value = values[cycle % values.length];
    else return;
    typed = String(value);
  };

  function onType(e: Event) {
    typed = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 7);
    value = Number(typed || 0);
  }

  // Each digit is a column of 0-9; the column slides to the digit with translateY.
  const cols = $derived(String(value).split('').map(Number));
</script>

<MotionStage label="Odometer: a KPI value rolls digit by digit" loop={2600}>
  {#snippet children(m)}
    <div class="odo" {@attach autoplay(m)}>
      <p class="odo__label">Monthly revenue (USD)</p>
      <!-- One stable value for assistive tech; the rolling columns are decoration. -->
      <p class="odo__value" role="img" aria-label={`${value.toLocaleString('en-US')} dollars`}>
        <span aria-hidden="true">$</span>
        {#each cols as d, i (cols.length - i)}
          <span class="odo__col" aria-hidden="true">
            <span class="odo__strip" class:odo__strip--run={!m.reduced} style="--d:{d}; --i:{cols.length - 1 - i}">
              {#each digits as n (n)}<span class="odo__digit">{n}</span>{/each}
            </span>
          </span>
        {/each}
      </p>
      <label class="odo__field">
        <span class="odo__hint">Type a number to roll it</span>
        <input
          class="odo__input"
          inputmode="numeric"
          autocomplete="off"
          value={typed}
          oninput={onType}
        />
      </label>
    </div>
  {/snippet}
</MotionStage>

<style>
  .odo { display: grid; gap: var(--ca-space-2); justify-items: start; }
  .odo__label { margin: 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .odo__value {
    display: flex;
    align-items: center;
    margin: 0;
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-display-2);
    font-weight: var(--ca-font-weight-heading);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--ca-text-primary);
  }
  /* The window shows exactly one digit tall: the strip slides behind it. */
  .odo__col { display: inline-block; block-size: 1em; overflow: hidden; }
  .odo__strip {
    display: flex;
    flex-direction: column;
    transform: translateY(calc(var(--d) * -1em));
  }
  .odo__strip--run {
    transition: transform 900ms cubic-bezier(0.2, 0.9, 0.2, 1) calc(var(--i) * 60ms);
  }
  .odo__digit { block-size: 1em; line-height: 1; text-align: center; }
  .odo__field { display: grid; gap: var(--ca-space-1); }
  .odo__hint { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .odo__input {
    inline-size: 9rem;
    padding: var(--ca-space-2) var(--ca-space-3);
    border: 1px solid var(--ca-outline-control);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
    color: var(--ca-text-primary);
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
  .odo__input:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
</style>

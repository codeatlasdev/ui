<script lang="ts">
  import { Button, Switch } from '@codeatlasdev/ui';

  let large = $state(false);
  let cue = $state(true);
</script>

<div class="stage" class:is-large={large}>
  <div class="controls">
    <Switch bind:checked={large} label="Text at 200% and a long translation" />
    <Switch bind:checked={cue} label="Continuation cue (peek at the next section)" />
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="frame" tabindex="0" role="region" aria-label="Phone-sized first screen, scrollable">
    <section class="hero">
      <p class="eyebrow">Inventory and point of sale</p>
      <h3 class="title">One system for the counter, the stock room and the kitchen</h3>
      <p class="lead">
        {large
          ? 'Sell at the counter, count stock in the back and send orders to the kitchen from the same screen, with the same people and the same numbers, even when the connection drops for a while.'
          : 'Sell, count stock and send orders from one screen.'}
      </p>
      <Button variant="filled">See how it works</Button>
    </section>
    <section class="next" class:is-peek={cue}>
      <h4>How it works</h4>
      <p>Three modules, one data model. Content below the first screen is reachable by scrolling and by the link above.</p>
    </section>
  </div>
</div>

<style>
  .stage { display: grid; gap: var(--ca-space-3); width: 100%; padding: var(--ca-space-4); }
  .controls { display: grid; gap: var(--ca-space-2); }
  .frame {
    inline-size: min(100%, 22rem); block-size: 26rem; overflow-y: auto; margin-inline: auto;
    border: var(--ca-border-width) solid var(--ca-outline-strong); border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-base);
  }
  /* The hero is a floor, never a ceiling: min-height, so larger text or a longer string grows it. */
  .hero {
    min-block-size: calc(100% - var(--ca-space-8)); padding: var(--ca-space-5);
    display: grid; align-content: center; justify-items: start; gap: var(--ca-space-3);
  }
  .eyebrow { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .title { margin: 0; font-size: var(--ca-font-size-h4); }
  .lead { margin: 0; color: var(--ca-text-body); }
  .is-large .title { font-size: var(--ca-font-size-h2); }
  .is-large .lead { font-size: var(--ca-font-size-body1); }
  .next { padding: var(--ca-space-5); border-block-start: var(--ca-border-width) solid var(--ca-outline-subtle); }
  .next h4 { margin: 0 0 var(--ca-space-2); }
  .next p { margin: 0; color: var(--ca-text-secondary); }
  /* Without the cue the hero fills the frame exactly and the next section is invisible: a false floor. */
  .next:not(.is-peek) { margin-block-start: var(--ca-space-8); }
</style>

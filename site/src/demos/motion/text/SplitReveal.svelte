<script lang="ts">
  import { Button, MotionStage } from '@codeatlasdev/ui';

  const headline = 'Close the books in one afternoon';
  const words = headline.split(' ');

  // Takeover: each click of the button (or Enter on it) re-runs the reveal on demand.
  let manual = $state(0);
</script>

<MotionStage label="Split text reveal: a headline rises in word by word" loop={3600}>
  {#snippet children(m)}
    <div class="split">
      <!-- The unsplit sentence is the accessible name; the animated words are hidden from AT. -->
      {#key `${m.cycle}-${manual}`}
        <h3 class="split__title" aria-label={headline}>
          {#each words as word, i (i)}
            <span class="split__mask" aria-hidden="true"
              ><span class="split__word" class:split__word--run={!m.reduced} style="--i:{i}">{word}</span
              ></span
            >{' '}
          {/each}
        </h3>
      {/key}
      <p class="split__sub">Reconciliation, approvals and the audit trail, on one screen.</p>
      <Button size="sm" variant="outlined" onclick={() => manual++}>Reveal again</Button>
    </div>
  {/snippet}
</MotionStage>

<style>
  .split { display: grid; gap: var(--ca-space-3); justify-items: start; max-width: 28rem; }
  .split__title {
    margin: 0;
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-h3);
    font-weight: var(--ca-font-weight-heading);
    line-height: 1.15;
    color: var(--ca-text-primary);
  }
  /* The mask clips the word while it rises from below its own line box. */
  .split__mask { display: inline-block; overflow: hidden; vertical-align: top; padding-block-end: 0.12em; }
  .split__word { display: inline-block; }
  .split__word--run {
    animation: split-rise 640ms cubic-bezier(0.2, 0, 0, 1) calc(var(--i) * 70ms) both;
  }
  .split__sub { margin: 0; color: var(--ca-text-secondary); }
  @keyframes split-rise {
    from { opacity: 0; transform: translateY(110%); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>

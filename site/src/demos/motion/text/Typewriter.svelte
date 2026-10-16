<script lang="ts">
  import { MotionStage, type MotionCtx } from '@codeatlasdev/ui';

  const phrases = ['Invoice #4821 is paid.', 'Reconcile 312 transactions.', 'Ask anything about Q3.'];
  const TYPE = 55; // 55ms per character, linear (a constant pace)
  const ERASE = 28; // 28ms per deleted character
  const HOLD = 1100; // 1100ms pause on a finished phrase

  let shown = $state(phrases[0]);
  let draft = $state('');

  /** One autoplay cycle types a phrase, holds it, then deletes it; the next cycle picks the next phrase. */
  const autoplay = (m: MotionCtx) => () => {
    if (m.reduced) {
      shown = phrases[0];
      return;
    }
    const phrase = phrases[m.cycle % phrases.length];
    let i = 0;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += dir;
      shown = phrase.slice(0, i);
      if (dir === 1 && i === phrase.length) {
        dir = -1;
        timer = setTimeout(step, HOLD);
      } else if (dir === -1 && i === 0) {
        return;
      } else timer = setTimeout(step, dir === 1 ? TYPE : ERASE);
    };
    shown = '';
    timer = setTimeout(step, TYPE);
    return () => clearTimeout(timer);
  };
</script>

<MotionStage label="Typewriter: a prompt types itself, holds, then deletes" loop={4800}>
  {#snippet children(m)}
    <div class="tw" {@attach autoplay(m)}>
      <label class="tw__label" for="tw-input">Assistant prompt</label>
      <div class="tw__box">
        <!-- The finished phrase is announced once by the input below; the typing is decoration. -->
        <span class="tw__text" aria-hidden="true">{m.playing || m.reduced ? shown : draft || shown}</span><span
          class="tw__caret"
          class:tw__caret--blink={!m.reduced}
          aria-hidden="true"
        ></span>
      </div>
      <input
        id="tw-input"
        class="tw__input"
        placeholder="Type to take over"
        autocomplete="off"
        bind:value={draft}
      />
    </div>
  {/snippet}
</MotionStage>

<style>
  .tw { display: grid; gap: var(--ca-space-2); inline-size: 100%; max-width: 26rem; }
  .tw__label { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .tw__box {
    display: flex;
    align-items: center;
    min-block-size: 3.25rem;
    padding: var(--ca-space-3) var(--ca-space-4);
    border: 1px solid var(--ca-outline-control);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-body1);
    color: var(--ca-text-primary);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .tw__caret {
    display: inline-block;
    inline-size: 2px;
    block-size: 1.2em;
    margin-inline-start: 2px;
    background: var(--ca-brand-main);
  }
  .tw__caret--blink { animation: tw-blink 1060ms steps(1, end) infinite; }
  .tw__input {
    min-block-size: var(--ca-touch-target);
    padding: var(--ca-space-2) var(--ca-space-3);
    border: 1px solid var(--ca-outline-control);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-base);
    color: var(--ca-text-primary);
    font: inherit;
  }
  .tw__input:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
  @keyframes tw-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
</style>

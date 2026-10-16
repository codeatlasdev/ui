<script lang="ts">
  // The hero's one prompt: read-only, monospace, fully readable (it scrolls inside its own box,
  // which is keyboard-focusable). Copy sits above it so the primary action never falls below the fold.
  import { CopyButton } from '@codeatlasdev/ui';
  import { AGENT_PROMPT } from '../../data/agent-prompt';

  let box = $state<HTMLElement>();
  let overflow = $state(false);

  // axe scrollable-region-focusable: a scrolling region must be reachable by keyboard.
  $effect(() => {
    if (!box) return;
    const measure = () => (overflow = box!.scrollHeight > box!.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  });
</script>

<div class="hp">
  <div class="hp__bar">
    <CopyButton value={AGENT_PROMPT} label="Copy prompt" variant="filled" size="lg" toast="Prompt copied. Paste it into your AI." class="hp__copy" />
    <a class="hp__link" href="/gallery/">or browse the gallery</a>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre bind:this={box} class="hero__prompt" tabindex={overflow ? 0 : -1} aria-label="Prompt for your AI assistant">{AGENT_PROMPT}</pre>
</div>

<style>
  .hp {
    display: grid;
    gap: var(--ca-space-3);
    min-inline-size: 0;
  }
  .hp__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ca-space-3) var(--ca-space-5);
  }
  /* The one loud control of the hero; full width on a phone. */
  .hp__bar :global(.hp__copy) {
    flex: 1 1 14rem;
    max-inline-size: 22rem;
  }
  .hp__link {
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
    text-decoration: underline;
    text-underline-offset: 3px;
    min-block-size: var(--ca-touch-target);
    display: inline-flex;
    align-items: center;
  }
  .hp__link:hover {
    color: var(--ca-text-primary);
  }
  .hp__link:focus-visible,
  .hero__prompt:focus-visible {
    outline: 2px solid var(--ca-focus-ring);
    outline-offset: 2px;
  }
  .hero__prompt {
    margin: 0;
    min-inline-size: 0;
    /* Scrolls in its own box, never clipped: the cap follows the real visible height. */
    max-block-size: min(22rem, calc(var(--ca-vh) * 0.45));
    overflow: auto;
    overscroll-behavior: contain;
    padding: var(--ca-space-3) var(--ca-space-4);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-sunken);
    color: var(--ca-text-primary);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-caption);
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    text-align: start;
  }
  @media (max-height: 38rem) {
    .hero__prompt {
      max-block-size: min(22rem, calc(var(--ca-vh) * 0.35));
    }
  }
</style>

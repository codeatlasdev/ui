<script lang="ts">
  // "Send this prompt to your agent": the whole setup as one copyable prompt.
  import { CopyButton } from '@codeatlasdev/ui';
  import { AGENT_PROMPT } from '../../data/agent-prompt';

  let open = $state(false);
</script>

<div class="sp glass-thin">
  <div class="sp__head">
    <div class="sp__label">
      <span class="sp__eyebrow">Let your AI assistant set it up</span>
      <span class="sp__hint">Copy this message into Claude Code, Cursor or Codex. It installs the library, sets up the theme and remembers your project rules.</span>
    </div>
    <CopyButton value={AGENT_PROMPT} label="Copy message" variant="filled" />
  </div>
  <!-- Scrollable when expanded: it must be keyboard-focusable (axe scrollable-region-focusable). -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre class="sp__body" class:sp__body--open={open} tabindex={open ? 0 : -1} aria-label="Setup message for your AI assistant">{AGENT_PROMPT}</pre>
  <button type="button" class="sp__more" aria-expanded={open} onclick={() => (open = !open)}>
    {open ? 'Show less' : 'Read the full message'}
  </button>
  <p class="sp__alt">Or just tell it: <code>follow https://ui.codeatlas.com.br/prompt.txt</code></p>
</div>

<style>
  .sp {
    display: grid;
    gap: var(--ca-space-3);
    padding: var(--ca-space-4);
    border-radius: var(--ca-radius-lg);
    text-align: left;
  }
  .sp__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-3);
  }
  .sp__label { display: grid; gap: 2px; min-width: 0; flex: 1 1 18rem; }
  .sp__eyebrow { font-weight: 600; color: var(--ca-text-primary); }
  .sp__hint { font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
  .sp__body {
    margin: 0;
    max-height: 7.5em;
    overflow: hidden;
    padding: var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-sunken);
    color: var(--ca-text-secondary);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-caption);
    line-height: 1.6;
    white-space: pre-wrap;
    mask-image: linear-gradient(to bottom, #000 55%, transparent);
  }
  .sp__body--open {
    max-height: min(28rem, calc(var(--ca-vh) * 0.6));
    overflow-y: auto;
    overscroll-behavior: contain;
    mask-image: none;
  }
  .sp__body:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
  .sp__more {
    min-height: var(--ca-touch-target);
    justify-self: start;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ca-brand-text);
    font: inherit;
    font-size: var(--ca-font-size-body2);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .sp__alt { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .sp__alt code { font-family: var(--ca-font-mono); color: var(--ca-text-primary); }
</style>

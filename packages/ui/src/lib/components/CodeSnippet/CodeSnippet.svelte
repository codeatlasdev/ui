<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Copy, Check } from '@lucide/svelte';
  import { copyToClipboard } from '../../utils/index.js';
  import { getHighlighter } from '../../utils/highlighter.js';
  const t = useT();

  interface Props {
    code: string;
    language?: string;
    class?: string;
  }

  let { code, language = 'svelte', class: className = '' }: Props = $props();

  let copied = $state(false);
  let highlightedHtml = $state<string | null>(null);

  // Both themes are emitted as --shiki-light / --shiki-dark; CSS picks one with light-dark(),
  // which follows the color-scheme of wherever the snippet sits (page, theme island, preview).
  $effect(() => {
    const lang = language;
    const src = code;
    getHighlighter().then((hl) => {
      highlightedHtml = hl.codeToHtml(src, {
        lang,
        themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
        defaultColor: false,
      });
    });
  });

  async function handleCopy() {
    await copyToClipboard(code);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="ca-code-snippet glass-overlay {className}">
  <div class="ca-code-snippet__toolbar">
    <span class="ca-code-snippet__lang">{language}</span>
    <button
      class="ca-code-snippet__copy"
      type="button"
      aria-label={copied ? t().codeSnippet.copied : t().codeSnippet.copyCode}
      onclick={handleCopy}
    >
      {#if copied}
        <Check size={14} stroke-width={2.5} />
        <span>{t().codeSnippet.copied}</span>
      {:else}
        <Copy size={14} stroke-width={2} />
        <span>{t().codeSnippet.copy}</span>
      {/if}
    </button>
  </div>
  {#if highlightedHtml}
    <div class="ca-code-snippet__pre">{@html highlightedHtml}</div>
  {:else}
    <pre class="ca-code-snippet__pre ca-code-snippet__pre--raw"><code>{code}</code></pre>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-code-snippet {
      border-radius: var(--ca-radius-lg);
      overflow: hidden;
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      margin-top: var(--ca-space-4);
    }

    .ca-code-snippet__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ca-space-2) var(--ca-space-4);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-code-snippet__lang {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
      font-family: var(--ca-font-mono);
    }

    .ca-code-snippet__copy {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--ca-space-0-5) var(--ca-space-1-5);
      border-radius: var(--ca-radius-xs);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-code-snippet__copy:hover {
      color: var(--ca-text-primary);
    }

    .ca-code-snippet__pre {
      margin: 0;
      overflow-x: auto;
      font-size: var(--ca-font-size-caption);
      line-height: var(--ca-line-height-prose);
    }

    /* Shiki renders a <pre> with inline background, neutralise it so glass shows through */
    .ca-code-snippet__pre :global(pre.shiki) {
      margin: 0;
      padding: var(--ca-space-4);
      background: transparent !important;
      font-family: var(--ca-font-mono);
      font-size: inherit;
      line-height: inherit;
    }

    .ca-code-snippet__pre :global(.shiki span) {
      color: light-dark(var(--shiki-light), var(--shiki-dark));
    }

    /* github-light-high-contrast comments (#66707B) sit at 4.48:1 on the glass surface; nudge to AA. */
    .ca-code-snippet__pre :global(.shiki span[style*='--shiki-light:#66707B']) {
      color: light-dark(#5a636d, var(--shiki-dark));
    }

    /* Fallback raw pre */
    .ca-code-snippet__pre--raw {
      padding: var(--ca-space-4);
      font-family: var(--ca-font-mono);
      color: var(--ca-text-primary);
      background: transparent;
    }
}
</style>

<script lang="ts" module>
  /** A tab given as data: plain `code`, or pre-highlighted `html` (e.g. shiki output at build time). */
  export interface CodeTabItem {
    label: string;
    code?: string;
    html?: string;
  }

  import { getContext, setContext } from 'svelte';

  const KEY = Symbol('ca-codetabs');

  interface CodeTabsContext {
    register(label: string): string;
    readonly active: string;
    readonly id: string;
  }

  export function getCodeTabsContext(): CodeTabsContext {
    const ctx = getContext<CodeTabsContext | undefined>(KEY);
    if (!ctx) throw new Error('<CodeTab> must be used inside <CodeTabs>');
    return ctx;
  }
</script>

<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { Check, Copy } from '@lucide/svelte';
  import { copyToClipboard } from '../../utils/clipboard.js';
  import { codeTabsPrefs } from './code-tabs-state.svelte.js';
  import CodeTab from './CodeTab.svelte';

  /**
   * CodeTabs: language tabs around highlighted code, with copy.
   *
   *   <CodeTabs sync="lang">
   *     <CodeTab label="cURL">…```bash block…</CodeTab>
   *     <CodeTab label="Node.js">…```ts block…</CodeTab>
   *   </CodeTabs>
   *
   * Highlighting stays with the consumer (shiki at build time); this component only
   * handles tabs, copy and preference sync. Groups sharing the same `sync` key follow
   * each other and persist the choice in localStorage. Panels stay in the DOM (SSR
   * friendly); the strip scrolls horizontally on narrow screens with 44px targets.
   */
  interface Props {
    /** Groups with the same key share the selected tab by label. Default: "lang". Empty string disables sync. */
    sync?: string;
    class?: string;
    /** `<CodeTab>` children. */
    children?: Snippet;
    /**
     * Tabs as data instead of children. Use it where Svelte context cannot reach the
     * children, e.g. Astro/MDX pages (each island is its own Svelte tree).
     */
    tabs?: CodeTabItem[];
  }

  let { sync = 'lang', class: className = '', children, tabs }: Props = $props();

  const uid = $props.id();

  let labels = $state<string[]>([]);
  // Index of the tab chosen in this group before a preference applies. SSR always renders tab 0.
  let local = $state(0);
  let root = $state<HTMLDivElement | null>(null);
  let copied = $state(false);

  setContext<CodeTabsContext>(KEY, {
    register(label) {
      const i = labels.length;
      labels.push(label);
      return `${i}`;
    },
    get active() {
      return `${current}`;
    },
    id: uid,
  });

  // Preferred label (if this group has it) wins over the local index.
  const current = $derived.by(() => {
    const pref = sync && codeTabsPrefs.ready ? codeTabsPrefs.get(sync) : undefined;
    const i = pref ? labels.indexOf(pref) : -1;
    return i >= 0 ? i : local;
  });

  onMount(() => codeTabsPrefs.init());

  function select(i: number) {
    local = i;
    if (sync) codeTabsPrefs.set(sync, labels[i]);
    copied = false;
  }

  function onkeydown(e: KeyboardEvent) {
    const n = labels.length;
    let next = -1;
    if (e.key === 'ArrowRight') next = (current + 1) % n;
    else if (e.key === 'ArrowLeft') next = (current - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    root?.querySelector<HTMLElement>(`#${uid}-tab-${next}`)?.focus();
  }

  async function copy() {
    const code = root?.querySelector<HTMLElement>(`#${uid}-panel-${current} pre`)?.textContent;
    if (code == null) return;
    if (await copyToClipboard(code.replace(/\n$/, ''))) {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }
</script>

<div class="ca-codetabs {className}" bind:this={root} data-active={current}>
  <!-- Panels come first in the DOM so they register their labels before the tab strip is
       emitted during SSR; `order: -1` on the bar restores the visual order. -->
  <div class="ca-codetabs__panels">
    {#if tabs}
      {#each tabs as tab, i (i)}
        <CodeTab label={tab.label}>
          {#if tab.html}{@html tab.html}{:else}
            <!-- Scrollable code must be keyboard-focusable (axe scrollable-region-focusable). -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="ca-code"><pre tabindex="0" role="region" aria-label={tab.label}><code>{tab.code ?? ''}</code></pre></div>
          {/if}
        </CodeTab>
      {/each}
    {:else}
      {@render children?.()}
    {/if}
  </div>

  <div class="ca-codetabs__bar">
    <div class="ca-codetabs__tabs" role="tablist" aria-label={t().docs.language} tabindex="-1" {onkeydown}>
      {#each labels as label, i (i)}
        <button
          type="button"
          role="tab"
          id="{uid}-tab-{i}"
          class="ca-codetabs__tab"
          aria-selected={i === current}
          aria-controls="{uid}-panel-{i}"
          tabindex={i === current ? 0 : -1}
          onclick={() => select(i)}
        >
          {label}
        </button>
      {/each}
    </div>
    <button type="button" class="ca-codetabs__copy" aria-label={copied ? t().docs.copied : t().docs.copyCode} onclick={copy}>
      {#if copied}
        <Check size={14} stroke-width={2.5} aria-hidden="true" /><span>{t().docs.copied}</span>
      {:else}
        <Copy size={14} stroke-width={2} aria-hidden="true" /><span>{t().docs.copy}</span>
      {/if}
    </button>
  </div>
</div>

<style>
  .ca-codetabs {
    display: flex;
    flex-direction: column;
    /* Shrinkable inside flex/grid parents: long lines scroll in the <pre>, never widen the page. */
    min-width: 0;
    max-width: 100%;
    margin: var(--ca-space-5) 0;
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
    overflow: hidden;
    container-type: inline-size;
  }

  .ca-codetabs__bar {
    order: -1;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: var(--ca-space-2);
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    padding-right: var(--ca-space-1);
  }

  .ca-codetabs__tabs {
    display: flex;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
  }

  .ca-codetabs__tabs::-webkit-scrollbar { display: none; }

  .ca-codetabs__tab {
    flex-shrink: 0;
    min-height: var(--ca-touch-target);
    padding: 0 var(--ca-space-4);
    border: none;
    border-bottom: var(--ca-border-width-strong) solid transparent;
    margin-bottom: calc(var(--ca-border-width) * -1);
    background: transparent;
    color: var(--ca-text-secondary);
    font-family: var(--ca-font-sans);
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color var(--ca-duration-fast) var(--ca-ease-standard),
      border-color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-codetabs__tab:hover { color: var(--ca-text-primary); }

  .ca-codetabs__tab[aria-selected='true'] {
    color: var(--ca-text-primary);
    border-bottom-color: var(--ca-brand-main);
  }

  .ca-codetabs__tab:focus-visible,
  .ca-codetabs__copy:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: calc(var(--ca-border-width-focus) * -1);
    border-radius: var(--ca-radius-sm);
  }

  .ca-codetabs__copy {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: var(--ca-space-1-5);
    flex-shrink: 0;
    min-height: var(--ca-touch-target);
    padding: 0 var(--ca-space-3);
    border: none;
    background: none;
    color: var(--ca-text-secondary);
    font-family: var(--ca-font-sans);
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
    transition: color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-codetabs__copy:hover { color: var(--ca-text-primary); }

  /* Inactive panels use the `hidden` attribute (set during SSR too, so no flash without JS). */
  .ca-codetabs__panels {
    min-width: 0;
  }

  .ca-codetabs__panels :global(.ca-code) {
    margin: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  /* On phones the label collapses to the icon to leave room for the tab strip. */
  @container (max-width: 599.98px) {
    .ca-codetabs__copy span { display: none; }
    .ca-codetabs__copy { min-width: var(--ca-touch-target); justify-content: center; padding: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-codetabs__tab,
    .ca-codetabs__copy { transition: none; }
  }
</style>

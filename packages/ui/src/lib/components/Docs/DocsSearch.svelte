<script lang="ts">
  import { focusTextField } from '../../actions/autofocus.js';
  import { t } from '../../i18n/state.svelte.js';
  import { Dialog } from 'bits-ui';
  import { CornerDownLeft, FileText, Hash, Search } from '@lucide/svelte';
  import Kbd from '../Kbd/Kbd.svelte';
  import '../Dialog/dialog.css';
  import { searchDocs, type DocsSearchResult } from './search.js';
  import type { DocsSearchEntry } from './types.js';

  /**
   * DocsSearch: full-text search dialog for docs.
   *
   * Desktop: command-palette style dialog near the top. Phones: full-height sheet with the
   * input pinned at the top (16px, no iOS zoom), 48px result rows and safe-area padding.
   *
   * `index` is either the entries or a loader called once on first open (fetch a static
   * search.json). `onselect` receives the href to navigate to (use SvelteKit's `goto`).
   * Opening via ⌘K / Ctrl+K / "/" is the consumer's job (see DocsShell, which wires it).
   */
  interface Props {
    open?: boolean;
    index: DocsSearchEntry[] | (() => Promise<DocsSearchEntry[]>);
    onselect: (href: string) => void;
    placeholder?: string;
    hint?: string;
    class?: string;
  }

  let {
    open = $bindable(false),
    index,
    onselect,
    placeholder,
    hint,
  }: Props = $props();

  let entries = $state<DocsSearchEntry[] | null>(null);
  let failed = $state(false);
  let query = $state('');
  let selected = $state(0);
  let input = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (!open) return;
    query = '';
    selected = 0;
    if (Array.isArray(index)) {
      entries = index;
    } else if (!entries) {
      failed = false;
      index()
        .then((data) => (entries = data))
        .catch(() => (failed = true));
    }
  });

  const results = $derived(entries ? searchDocs(entries, query) : []);

  function go(r: DocsSearchResult | undefined) {
    if (!r) return;
    open = false;
    onselect(r.href);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(selected + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[selected]);
    }
  }

  // Keep the highlighted row in view while arrowing through a long list.
  $effect(() => {
    document.getElementById(`ca-docs-search-opt-${selected}`)?.scrollIntoView({ block: 'nearest' });
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="ca-overlay ca-docs-search__overlay" />
    <Dialog.Content
      class="ca-docs-search"
      aria-label={t().docs.search.label}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        focusTextField(input);
      }}
    >
      <Dialog.Title class="ca-docs-search__sr">{t().docs.search.label}</Dialog.Title>
      <div class="ca-docs-search__bar">
        <Search size={18} aria-hidden="true" />
        <input
          bind:this={input}
          bind:value={query}
          oninput={() => (selected = 0)}
          {onkeydown}
          class="ca-docs-search__input"
          type="search"
          enterkeyhint="go"
          placeholder={placeholder ?? t().docs.search.placeholder}
          role="combobox"
          aria-label={t().docs.search.short}
          aria-expanded={results.length > 0}
          aria-controls="ca-docs-search-results"
          aria-activedescendant={results.length ? `ca-docs-search-opt-${selected}` : undefined}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <Dialog.Close class="ca-docs-search__cancel">{t().docs.search.close}</Dialog.Close>
        <span class="ca-docs-search__esc"><Kbd>Esc</Kbd></span>
      </div>

      <div class="ca-docs-search__body">
        {#if query.trim() && entries}
          {#if results.length}
            <ul id="ca-docs-search-results" class="ca-docs-search__results" role="listbox" aria-label={t().docs.search.results}>
              {#each results as r, i (r.href)}
                <!-- The combobox input drives the list (aria-activedescendant). The option is a real link,
                     so middle-click / Ctrl-click / copy link work; plain clicks route through `onselect`. -->
                <li role="none">
                  <a
                    href={r.href}
                    role="option"
                    tabindex="-1"
                    id="ca-docs-search-opt-{i}"
                    aria-selected={i === selected}
                    class="ca-docs-search__result"
                    class:ca-docs-search__result--on={i === selected}
                    onmouseenter={() => (selected = i)}
                    onclick={(e) => {
                      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      go(r);
                    }}
                  >
                    <span class="ca-docs-search__icon">
                      {#if r.kind === 'page'}<FileText size={16} />{:else}<Hash size={16} />{/if}
                    </span>
                    <span class="ca-docs-search__text">
                      <span class="ca-docs-search__title">{r.title}</span>
                      <span class="ca-docs-search__context">{r.context}</span>
                    </span>
                    {#if i === selected}<span class="ca-docs-search__enter"><CornerDownLeft size={14} /></span>{/if}
                  </a>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="ca-docs-search__empty" role="status">{t().docs.search.empty(query)}</p>
          {/if}
        {:else if failed}
          <p class="ca-docs-search__empty" role="status">{t().docs.search.failed}</p>
        {:else if query.trim()}
          <p class="ca-docs-search__empty" role="status">{t().docs.search.loading}</p>
        {:else}
          <p class="ca-docs-search__empty">{hint ?? t().docs.search.hint}</p>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.ca-overlay.ca-docs-search__overlay) {
    z-index: var(--ca-z-modal);
  }

  :global(.ca-docs-search__sr) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Phones: full-height sheet, input pinned on top. */
  :global(.ca-docs-search) {
    position: fixed;
    inset: 0;
    z-index: calc(var(--ca-z-modal) + 1);
    display: flex;
    flex-direction: column;
    background: var(--ca-surface-overlay);
    outline: none;
  }

  :global(.ca-docs-search[data-state='open']) {
    animation: ca-docs-search-in var(--ca-duration-fast) var(--ca-ease-decelerate) both;
  }

  :global(.ca-docs-search[data-state='closed']) {
    animation: ca-docs-search-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  }

  .ca-docs-search__bar {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2-5);
    flex-shrink: 0;
    padding: calc(var(--ca-space-2) + var(--ca-safe-top)) max(var(--ca-space-3), var(--ca-safe-right)) var(--ca-space-2)
      max(var(--ca-space-4), var(--ca-safe-left));
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    color: var(--ca-text-hint);
  }

  .ca-docs-search__input {
    flex: 1;
    min-width: 0;
    height: var(--ca-touch-target);
    border: none;
    background: transparent;
    color: var(--ca-text-primary);
    font: inherit;
    /* 16px floor: iOS Safari zooms into focused fields below it. */
    font-size: max(16px, var(--ca-input-font-size));
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .ca-docs-search__input::placeholder { color: var(--ca-text-hint); }
  .ca-docs-search__input::-webkit-search-cancel-button { display: none; }

  :global(.ca-docs-search__cancel) {
    flex-shrink: 0;
    min-height: var(--ca-touch-target);
    padding: 0 var(--ca-space-2);
    border: none;
    background: none;
    color: var(--ca-brand-text);
    font: inherit;
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    cursor: pointer;
  }

  :global(.ca-docs-search__cancel:focus-visible) {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: calc(var(--ca-border-width-focus) * -1);
    border-radius: var(--ca-radius-sm);
  }

  .ca-docs-search__esc { display: none; }

  .ca-docs-search__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--ca-space-2) max(var(--ca-space-2), var(--ca-safe-right)) calc(var(--ca-space-2) + var(--ca-safe-bottom))
      max(var(--ca-space-2), var(--ca-safe-left));
  }

  .ca-docs-search__results {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-0-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ca-docs-search__result {
    display: flex;
    align-items: center;
    gap: var(--ca-space-3);
    min-height: var(--ca-space-12);
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-primary);
    text-decoration: none;
    cursor: pointer;
  }

  .ca-docs-search__result--on {
    background: color-mix(in oklab, var(--ca-brand-main) 12%, transparent);
  }

  .ca-docs-search__icon { display: flex; color: var(--ca-text-hint); }
  .ca-docs-search__result--on .ca-docs-search__icon,
  .ca-docs-search__enter { color: var(--ca-brand-text); }
  .ca-docs-search__enter { display: none; }

  .ca-docs-search__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .ca-docs-search__title {
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-medium);
    overflow-wrap: anywhere;
  }

  .ca-docs-search__context {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
  }

  .ca-docs-search__empty {
    margin: 0;
    padding: var(--ca-space-8) var(--ca-space-4);
    text-align: center;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
  }

  /* Desktop: palette-style dialog. */
  @media (min-width: 900px) {
    :global(.ca-docs-search) {
      inset: auto;
      top: 14vh;
      left: 50%;
      width: min(40rem, calc(100vw - var(--ca-space-8)));
      max-height: min(calc(var(--ca-vh) * 0.7), 32rem);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-xl);
      box-shadow: var(--ca-shadow-xl);
      overflow: hidden;
      transform: translateX(-50%);
    }

    :global(.ca-docs-search[data-state='open']) {
      animation-name: ca-docs-search-pop-in;
    }

    :global(.ca-docs-search[data-state='closed']) {
      animation-name: ca-docs-search-pop-out;
    }

    .ca-docs-search__bar { padding: var(--ca-space-1-5) var(--ca-space-3) var(--ca-space-1-5) var(--ca-space-4); }
    :global(.ca-docs-search__cancel) { display: none; }
    .ca-docs-search__esc { display: block; }
    .ca-docs-search__result { min-height: var(--ca-touch-target); }
    .ca-docs-search__enter { display: flex; }
    .ca-docs-search__body { padding-bottom: var(--ca-space-2); }
  }

  @keyframes ca-docs-search-in {
    from { opacity: 0; transform: translateY(var(--ca-space-2)); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ca-docs-search-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes ca-docs-search-pop-in {
    from { opacity: 0; transform: translateX(-50%) translateY(calc(var(--ca-space-2) * -1)) scale(0.98); }
    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }
  @keyframes ca-docs-search-pop-out {
    from { opacity: 1; transform: translateX(-50%); }
    to { opacity: 0; transform: translateX(-50%); }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.ca-docs-search[data-state='open']),
    :global(.ca-docs-search[data-state='closed']) { animation: none; }
  }
</style>

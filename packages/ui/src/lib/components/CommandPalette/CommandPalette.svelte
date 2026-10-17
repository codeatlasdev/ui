<script lang="ts">
  import { untrack } from 'svelte';
  import { focusTextField } from '../../actions/autofocus.js';
  import { useT } from '../../i18n/state.svelte.js';
  import { createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.js';
  import '../Dialog/dialog.css';
  import { Search, Loader } from '@lucide/svelte';
  import type { NavModule, NavItem } from '../AppShell/types.js';
  import { isNavSection } from '../AppShell/types.js';
  import { announce } from '../../utils/announce.js';
  const t = useT();

  /** A result returned by the `search` callback (server-side / async results). */
  export interface CommandResult {
    /** Unique id within the result set. */
    id: string;
    /** Display label. */
    label: string;
    /** Optional group heading shown above the result. */
    group?: string;
    /** Path passed to `onNavigate` when the item is activated. */
    path: string;
  }

  interface Props {
    modules: NavModule[];
    onNavigate: (path: string) => void;
    /** Called with the full `CommandResult` when a server result is activated. When provided, `onNavigate` is NOT called for server results. */
    onSelect?: (result: CommandResult) => void;
    open?: boolean;
    /** Expose `query` for the caller (bind:query). */
    query?: string;
    /** Characters (after trimming) needed before filtering; shorter queries show every item grouped. */
    minQueryLength?: number;
    /**
     * Async search function. Called with the trimmed query and an `AbortSignal`; must throw / reject
     * with a `DOMException("Aborted", "AbortError")` on abort (the standard `signal.throwIfAborted()`
     * pattern). Returns `CommandResult[]`.
     */
    search?: (query: string, signal: AbortSignal) => Promise<CommandResult[]>;
    /** Debounce delay (ms) before `search` is called after the last keystroke. Default 200. */
    searchDebounce?: number;
  }

  let {
    modules,
    onNavigate,
    onSelect,
    open               = $bindable(false),
    query              = $bindable(''),
    minQueryLength     = 1,
    search: searchFn,
    searchDebounce     = 200,
  }: Props = $props();

  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);

  // ── Async search state ────────────────────────────────────────────────────
  type SearchStatus = 'idle' | 'loading' | 'done' | 'error';
  let searchStatus = $state<SearchStatus>('idle');
  let serverResults = $state.raw<CommandResult[]>([]);

  // ── Local items (from modules) ────────────────────────────────────────────
  type FlatItem = NavItem & { moduleLabel: string };

  function flatItems(mods: NavModule[]): FlatItem[] {
    return mods.flatMap((mod) =>
      mod.items.flatMap((entry) => {
        if (isNavSection(entry)) {
          return entry.items.map((item) => ({ ...item, moduleLabel: mod.label }));
        }
        return [{ ...entry, moduleLabel: mod.label }];
      })
    );
  }

  let allItems = $derived(flatItems(modules));

  const term = $derived(query.trim().toLowerCase());
  const filtering = $derived(term.length >= Math.max(1, minQueryLength));

  let localFiltered = $derived(
    filtering
      ? allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(term) || item.moduleLabel.toLowerCase().includes(term)
        )
      : allItems
  );

  // Map<moduleLabel, items> for the unfiltered grouped view
  let grouped = $derived(
    filtering
      ? null
      : (() => {
          const groups = new Map<string, FlatItem[]>();
          for (const item of allItems) {
            if (!groups.has(item.moduleLabel)) groups.set(item.moduleLabel, []);
            groups.get(item.moduleLabel)!.push(item);
          }
          return groups;
        })()
  );

  // ── Merged flat list for keyboard navigation ──────────────────────────────
  // Local items always come first, then server results (only shown while filtering).
  type AnyItem = FlatItem | CommandResult;
  let allVisible = $derived<AnyItem[]>(
    filtering
      ? [...localFiltered, ...(searchStatus === 'done' ? serverResults : [])]
      : allItems
  );

  // Row index lookup and server grouping depend on the list only, never on `selectedIndex`, so an
  // arrow press does no per-row list scans (#97).
  let indexOf = $derived(new Map<AnyItem, number>(allVisible.map((item, i) => [item, i])));
  let serverGroups = $derived(groupServerResults(searchStatus === 'done' ? serverResults : []));

  // ── Debounced async search ────────────────────────────────────────────────
  // Plain (non-reactive) handles: the effect below must only depend on `term`.
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentAbort: AbortController | null = null;

  function cancelSearch() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = null;
    currentAbort?.abort();
    currentAbort = null;
  }

  $effect(() => {
    const capturedTerm = term;
    const run = !!searchFn && filtering;
    // Every query change (and close) cancels the pending timer and aborts the in-flight request.
    cancelSearch();
    untrack(() => {
      if (searchStatus !== 'idle') searchStatus = 'idle';
      if (serverResults.length > 0) serverResults = [];
    });
    if (!run) return;

    const fn = searchFn!;
    const delay = searchDebounce;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      const ctrl = new AbortController();
      currentAbort = ctrl;
      searchStatus = 'loading';
      announce(t().commandPalette.searching);
      try {
        const results = await fn(capturedTerm, ctrl.signal);
        if (currentAbort !== ctrl) return;
        currentAbort = null;
        serverResults = results;
        searchStatus = 'done';
        const total = results.length + localFiltered.length;
        announce(
          total === 0
            ? t().commandPalette.empty(capturedTerm)
            : t().commandPalette.resultCount(total)
        );
      } catch (err) {
        // Superseded or aborted: a newer query owns the state now.
        if (currentAbort !== ctrl || ctrl.signal.aborted) return;
        currentAbort = null;
        serverResults = [];
        searchStatus = 'error';
        announce(t().commandPalette.searchFailed, 'assertive');
      }
    }, delay);

    return cancelSearch;
  });

  // ── Cleanup on close ──────────────────────────────────────────────────────
  let openedByKeyboard = false;

  $effect(() => {
    if (!open) {
      query = '';
      selectedIndex = 0;
    }
  });

  $effect(() => {
    if (selectedIndex >= allVisible.length) {
      selectedIndex = Math.max(0, allVisible.length - 1);
    }
  });

  // Rows set the selection on `mousemove`, not `mouseenter` (#80).
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.max(0, Math.min(selectedIndex + 1, allVisible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && allVisible[selectedIndex]) {
      e.preventDefault();
      pendingEnter = true;
      activateItem(allVisible[selectedIndex]);
    }
  }

  let pendingEnter = false;

  function handleKeyup(e: KeyboardEvent) {
    if (e.key !== 'Enter' || !pendingEnter) return;
    pendingEnter = false;
    open = false;
  }

  function activateItem(item: AnyItem) {
    // Server result: call onSelect if provided, otherwise navigate
    if ('id' in item && !('icon' in item)) {
      const r = item as CommandResult;
      if (onSelect) {
        open = false;
        onSelect(r);
      } else {
        onNavigate(r.path);
        // close happens on keyup for keyboard, immediately for click
      }
      return;
    }
    onNavigate((item as FlatItem).path);
  }

  function clickItem(item: AnyItem) {
    open = false;
    activateItem(item);
  }

  const presence = createPresence(() => open);

  function handleGlobal(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openedByKeyboard = !open;
      open = !open;
    }
  }

  // Group server results by their `group` field
  function groupServerResults(results: CommandResult[]): Map<string, CommandResult[]> {
    const map = new Map<string, CommandResult[]>();
    for (const r of results) {
      const key = r.group ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }
</script>

<svelte:window onkeydown={handleGlobal} />

{#if presence.present}
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <dialog
    class="ca-overlay ca-cmd-overlay ca-cmd-dialog glass-panel"
    role="dialog"
    aria-label={t().commandPalette.dialog}
    data-state={open ? 'open' : 'closed'}
    {@attach presence.ref}
    {@attach modalLayer(() => ({
      onDismiss: () => (open = false),
      closing: !open,
      initial: false,
      onOpen: () => {
        const force = openedByKeyboard;
        openedByKeyboard = false;
        focusTextField(inputRef, force);
      },
    }))}
  >
    <div class="ca-cmd-search">
      <Search size={16} class="ca-cmd-search__icon" />
      <input
        bind:this={inputRef}
        bind:value={query}
        type="text"
        placeholder={t().commandPalette.placeholder}
        class="ca-cmd-search__input"
        onkeydown={handleKeydown}
        onkeyup={handleKeyup}
        autocomplete="off"
        spellcheck={false}
      />
      {#if searchStatus === 'loading'}
        <Loader size={14} class="ca-cmd-search__spinner" aria-hidden="true" />
      {:else}
        <kbd class="ca-cmd-search__hint">ESC</kbd>
      {/if}
    </div>

    <div
      class="ca-cmd-list"
      role="listbox"
      aria-label={t().commandPalette.commands}
      aria-busy={searchStatus === 'loading' ? 'true' : undefined}
    >
      {#if filtering}
        <!-- Filtered: local items first, then server results by group -->
        {#if localFiltered.length > 0}
          {#each localFiltered as item}
            {@const i = indexOf.get(item) ?? -1}
            {@const Icon = item.icon}
            <button
              role="option"
              aria-selected={i === selectedIndex}
              class="ca-cmd-item {i === selectedIndex ? 'ca-cmd-item--active' : ''}"
              onclick={() => clickItem(item)}
              onmousemove={() => { selectedIndex = i; }}
            >
              <Icon size={14} class="ca-cmd-item__icon" />
              <span class="ca-cmd-item__label">{item.label}</span>
              <span class="ca-cmd-item__module">{item.moduleLabel}</span>
            </button>
          {/each}
        {/if}
        {#if serverGroups.size > 0}
          {#each [...serverGroups] as [groupLabel, items]}
            <div class="ca-cmd-group">
              {#if groupLabel}<div class="ca-cmd-group__label">{groupLabel}</div>{/if}
              {#each items as item}
                {@const i = indexOf.get(item) ?? -1}
                <button
                  role="option"
                  aria-selected={i === selectedIndex}
                  class="ca-cmd-item {i === selectedIndex ? 'ca-cmd-item--active' : ''}"
                  onclick={() => clickItem(item)}
                  onmousemove={() => { selectedIndex = i; }}
                >
                  <span class="ca-cmd-item__label">{item.label}</span>
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      {:else}
        <!-- Unfiltered / grouped local items -->
        {#each [...(grouped ?? new Map()).entries()] as [groupLabel, items]}
          <div class="ca-cmd-group">
            <div class="ca-cmd-group__label">{groupLabel}</div>
            {#each items as item}
              {@const i = indexOf.get(item) ?? -1}
              {@const Icon = item.icon}
              <button
                role="option"
                aria-selected={i === selectedIndex}
                class="ca-cmd-item {i === selectedIndex ? 'ca-cmd-item--active' : ''}"
                onclick={() => clickItem(item)}
                onmousemove={() => { selectedIndex = i; }}
              >
                <Icon size={14} class="ca-cmd-item__icon" />
                <span class="ca-cmd-item__label">{item.label}</span>
              </button>
            {/each}
          </div>
        {/each}
      {/if}
    </div>
    {#if filtering && searchStatus === 'loading'}
      <div class="ca-cmd-loading">{t().commandPalette.searching}</div>
    {:else if filtering && searchStatus === 'error'}
      <div class="ca-cmd-error" role="alert">{t().commandPalette.searchFailed}</div>
    {:else if filtering && allVisible.length === 0}
      <div class="ca-cmd-empty">{t().commandPalette.empty(query)}</div>
    {/if}
  </dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(dialog.ca-cmd-overlay[data-state='open']::backdrop) {
      animation-duration: var(--ca-duration-base);
    }

    :global(dialog.ca-cmd-dialog) {
      inset: auto;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: min(560px, calc(100vw - 2 * var(--ca-space-4)));
      max-height: calc(var(--ca-vh) * 0.6);
      flex-direction: column;
      border: 1px solid var(--ca-panel-border);
      border-radius: var(--ca-radius-xl);
      overflow: hidden;
      outline: none;
      padding: 0;
    }
    :global(dialog.ca-cmd-dialog[open]) {
      display: flex;
    }

    :global(.ca-cmd-dialog[data-state='open']) {
      animation: ca-cmd-slide-in var(--ca-enter-base) var(--ca-ease-decelerate);
    }

    :global(.ca-cmd-dialog[data-state='closed']) {
      animation: ca-cmd-slide-out var(--ca-enter-fast) var(--ca-ease-standard);
    }

    .ca-cmd-search {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2-5);
      padding: var(--ca-space-3-5) var(--ca-space-4);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      flex-shrink: 0;
    }

    :global(.ca-cmd-search__icon) {
      color: var(--ca-text-hint);
      flex-shrink: 0;
    }

    :global(.ca-cmd-search__spinner) {
      color: var(--ca-text-hint);
      flex-shrink: 0;
      animation: ca-cmd-spin 1s linear infinite;
    }

    @keyframes ca-cmd-spin {
      to { transform: rotate(360deg); }
    }

    .ca-cmd-search__input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-size: max(var(--ca-input-font-size), var(--ca-font-size-body1));
      color: var(--ca-text-primary);
      font-family: inherit;
    }

    .ca-cmd-search__input::placeholder {
      color: var(--ca-text-hint);
    }

    .ca-cmd-search__hint {
      font-size: var(--ca-font-size-micro);
      padding: var(--ca-space-0-5) var(--ca-space-1);
      border-radius: var(--ca-radius-xs);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      color: var(--ca-text-hint);
      font-family: var(--ca-font-mono);
      line-height: var(--ca-line-height-body);
    }

    .ca-cmd-list {
      overflow-y: auto;
      padding: var(--ca-space-1-5);
    }

    .ca-cmd-group__label {
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-hint);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
      padding: var(--ca-space-2) var(--ca-space-2-5) var(--ca-space-1);
    }

    .ca-cmd-item {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2-5);
      width: 100%;
      padding: var(--ca-space-2) var(--ca-space-2-5);
      border-radius: var(--ca-radius-sm);
      border: none;
      background: none;
      cursor: pointer;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
      text-align: left;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-cmd-item--active,
    .ca-cmd-item:hover {
      background: var(--ca-action-hover);
    }

    :global(.ca-cmd-item__icon) {
      color: var(--ca-text-secondary);
      flex-shrink: 0;
    }

    .ca-cmd-item__label {
      flex: 1;
    }

    .ca-cmd-item__module {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
    }

    .ca-cmd-empty,
    .ca-cmd-loading,
    .ca-cmd-error {
      padding: var(--ca-space-8) var(--ca-space-4);
      text-align: center;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-hint);
    }

    .ca-cmd-error {
      color: var(--ca-semantic-error);
    }

    @keyframes ca-cmd-slide-in {
      from { opacity: 0; transform: translateX(-50%) translateY(calc(-1 * var(--ca-space-3))); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    @keyframes ca-cmd-slide-out {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to   { opacity: 0; transform: translateX(-50%) translateY(calc(-1 * var(--ca-space-2))); }
    }
}
</style>

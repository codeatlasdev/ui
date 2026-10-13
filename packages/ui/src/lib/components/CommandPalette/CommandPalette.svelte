<script lang="ts">
  import { focusTextField } from '../../actions/autofocus.js';
  import { t } from '../../i18n/state.svelte.js';
  import { Dialog } from 'bits-ui';
  import { Search } from '@lucide/svelte';
  import type { NavModule, NavItem } from '../AppShell/types.js';
  import { isNavSection } from '../AppShell/types.js';

  interface Props {
    modules: NavModule[];
    onNavigate: (path: string) => void;
    open?: boolean;
    /** Characters (after trimming) needed before the list is filtered; shorter queries show every item grouped. */
    minQueryLength?: number;
  }

  let { modules, onNavigate, open = $bindable(false), minQueryLength = 1 }: Props = $props();

  let query = $state('');
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);

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

  let filtered = $derived(
    filtering
      ? allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(term) || item.moduleLabel.toLowerCase().includes(term)
        )
      : allItems
  );

  // Map<moduleLabel, items>, only computed when not filtering
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

  $effect(() => {
    if (open) {
      query = '';
      selectedIndex = 0;
      requestAnimationFrame(() => focusTextField(inputRef));
    }
  });

  $effect(() => {
    if (selectedIndex >= filtered.length) {
      selectedIndex = Math.max(0, filtered.length - 1);
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      // bits-ui returns focus to the trigger the moment `open` flips. Closing inside this keydown
      // would let the same Enter press (keypress/click) activate that trigger and reopen the
      // palette, so navigate now and close on keyup, after the press has finished.
      e.preventDefault();
      pendingEnter = true;
      onNavigate(filtered[selectedIndex].path);
    }
  }

  let pendingEnter = false;

  function handleKeyup(e: KeyboardEvent) {
    if (e.key !== 'Enter' || !pendingEnter) return;
    pendingEnter = false;
    open = false;
  }

  function navigate(path: string) {
    open = false;
    onNavigate(path);
  }

  function handleGlobal(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
    }
  }
</script>

<svelte:window onkeydown={handleGlobal} />

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="ca-cmd-overlay" />
    <Dialog.Content class="ca-cmd-dialog glass-panel" aria-label={t().commandPalette.dialog}>
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
        <kbd class="ca-cmd-search__hint">ESC</kbd>
      </div>

      <div class="ca-cmd-list" role="listbox" aria-label={t().commandPalette.commands}>
        {#if filtered.length === 0}
          <div class="ca-cmd-empty">{t().commandPalette.empty(query)}</div>
        {:else if filtering}
          {#each filtered as item, i}
            {@const Icon = item.icon}
            <button
              role="option"
              aria-selected={i === selectedIndex}
              class="ca-cmd-item {i === selectedIndex ? 'ca-cmd-item--active' : ''}"
              onclick={() => navigate(item.path)}
              onmouseenter={() => { selectedIndex = i; }}
            >
              <Icon size={14} class="ca-cmd-item__icon" />
              <span class="ca-cmd-item__label">{item.label}</span>
              <span class="ca-cmd-item__module">{item.moduleLabel}</span>
            </button>
          {/each}
        {:else}
          {#each [...(grouped ?? new Map()).entries()] as [groupLabel, items]}
            <div class="ca-cmd-group">
              <div class="ca-cmd-group__label">{groupLabel}</div>
              {#each items as item}
                {@const i = filtered.indexOf(item)}
                {@const Icon = item.icon}
                <button
                  role="option"
                  aria-selected={i === selectedIndex}
                  class="ca-cmd-item {i === selectedIndex ? 'ca-cmd-item--active' : ''}"
                  onclick={() => navigate(item.path)}
                  onmouseenter={() => { selectedIndex = i; }}
                >
                  <Icon size={14} class="ca-cmd-item__icon" />
                  <span class="ca-cmd-item__label">{item.label}</span>
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.ca-cmd-overlay) {
    position: fixed;
    inset: 0;
    background: var(--ca-scrim-color);
    z-index: var(--ca-z-modal);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    animation: ca-cmd-fade-in var(--ca-duration-base) var(--ca-ease-decelerate);
  }

  :global(.ca-cmd-overlay[data-state='closed']) {
    animation: ca-cmd-fade-out var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-cmd-dialog) {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: min(560px, calc(100vw - 32px));
    max-height: calc(var(--ca-vh) * 0.6);
    display: flex;
    flex-direction: column;
    border-radius: var(--ca-radius-xl);
    z-index: calc(var(--ca-z-modal) + 1);
    overflow: hidden;
    outline: none;
    padding: 0;
  }

  :global(.ca-cmd-dialog[data-state='open']) {
    animation: ca-cmd-slide-in var(--ca-duration-base) var(--ca-ease-decelerate);
  }

  :global(.ca-cmd-dialog[data-state='closed']) {
    animation: ca-cmd-slide-out var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-cmd-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--ca-outline-subtle);
    flex-shrink: 0;
  }

  :global(.ca-cmd-search__icon) {
    color: var(--ca-text-hint);
    flex-shrink: 0;
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
    padding: 2px 5px;
    border-radius: var(--ca-radius-xs);
    border: 1px solid var(--ca-outline-subtle);
    color: var(--ca-text-hint);
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    line-height: 1.4;
  }

  .ca-cmd-list {
    overflow-y: auto;
    padding: 6px;
  }

  .ca-cmd-group__label {
    font-size: var(--ca-font-size-caption);
    font-weight: 600;
    color: var(--ca-text-hint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 10px 4px;
  }

  .ca-cmd-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
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

  .ca-cmd-empty {
    padding: 32px 16px;
    text-align: center;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-hint);
  }

  @keyframes ca-cmd-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes ca-cmd-fade-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  @keyframes ca-cmd-slide-in {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes ca-cmd-slide-out {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to   { opacity: 0; transform: translateX(-50%) translateY(-8px); }
  }

</style>

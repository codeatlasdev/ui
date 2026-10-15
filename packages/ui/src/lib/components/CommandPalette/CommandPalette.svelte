<script lang="ts">
  import { focusTextField } from '../../actions/autofocus.js';
  import { useT } from '../../i18n/state.svelte.js';
  import { createPresence } from '../../primitives/index.js';
  import { modalLayer } from '../Dialog/modal-layer.js';
  import '../Dialog/dialog.css';
  import { Search } from '@lucide/svelte';
  import type { NavModule, NavItem } from '../AppShell/types.js';
  import { isNavSection } from '../AppShell/types.js';
  const t = useT();

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

  let openedByKeyboard = false;

  $effect(() => {
    if (open) {
      query = '';
      selectedIndex = 0;
      const force = openedByKeyboard;
      openedByKeyboard = false;
      // A shortcut means "I'm about to type": focus the field even on touch devices with a
      // keyboard (iPad + keyboard). A tap-open keeps the default (no surprise on-screen keyboard).
      requestAnimationFrame(() => focusTextField(inputRef, force));
    }
  });

  $effect(() => {
    if (selectedIndex >= filtered.length) {
      selectedIndex = Math.max(0, filtered.length - 1);
    }
  });

  // Rows set the selection on `mousemove`, not `mouseenter`: a row that merely appears or slides under
  // a stationary pointer (list renders, dialog animates in) fires mouseenter and would steal the
  // keyboard selection (#80). The row handlers below are the only pointer path.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Empty list: stay on 0, never -1 (the next results render would have nothing selected).
      selectedIndex = Math.max(0, Math.min(selectedIndex + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      // Focus returns to the trigger the moment the layer unmounts. Closing inside this keydown
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

  const presence = createPresence(() => open);


  function handleGlobal(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openedByKeyboard = !open;
      open = !open;
    }
  }
</script>

<svelte:window onkeydown={handleGlobal} />

{#if presence.present}
  <!-- An explicit role keeps `[role="dialog"]` selectors (and every engine) seeing the dialog. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <dialog
    class="ca-overlay ca-cmd-overlay ca-cmd-dialog glass-panel"
    role="dialog"
    aria-label={t().commandPalette.dialog}
    data-state={open ? 'open' : 'closed'}
    {@attach presence.ref}
    {@attach modalLayer(() => ({ onDismiss: () => (open = false), initial: false }))}
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
              onmousemove={() => { selectedIndex = i; }}
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
  </dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Palette scrim: same --ca-scrim-blur as the shared overlay (inherited), a slower fade. */
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
      animation: ca-cmd-slide-in var(--ca-duration-base) var(--ca-ease-decelerate);
    }

    :global(.ca-cmd-dialog[data-state='closed']) {
      animation: ca-cmd-slide-out var(--ca-duration-fast) var(--ca-ease-standard);
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

    .ca-cmd-empty {
      padding: var(--ca-space-8) var(--ca-space-4);
      text-align: center;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-hint);
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

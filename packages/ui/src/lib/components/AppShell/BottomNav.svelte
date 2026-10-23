<script lang="ts">
  import { Ellipsis } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { appShell } from '../../i18n/groups/appShell.js';
  import NavModuleBadge from './NavModuleBadge.svelte';
  import type { Component } from 'svelte';
  import { X } from '@lucide/svelte';
  import type { NavModule, NavMoreSheetProps } from './types.js';
  import { hasModuleBadge, moduleName } from './types.js';
  const t = useMessages(appShell);

  interface Props {
    modules: NavModule[];
    activeIndex: number;
    onSelect: (index: number) => void;
    /**
     * Most tabs on the bar. With more modules than this, the first `primary - 1` stay and the last
     * tab is "More", a sheet with the rest. Default 5 (4 modules + More once there are 6 or more).
     */
    primary?: number;
    /**
     * Swap the built-in "More" dialog for another component, e.g. the exported `NavMoreSheet`
     * (a full `Sheet` with swipe-to-dismiss and an exit animation). Opt-in because `Sheet` adds
     * about 10 kB gzip to the shell; the built-in dialog needs nothing the shell does not bundle.
     */
    moreSheet?: Component<NavMoreSheetProps>;
    /** Extra content in the "More" sheet under the modules (search, account, sign out). */
    overflow?: Snippet;
    class?: string;
  }

  let { modules, activeIndex, onSelect, primary = 5, moreSheet, overflow, class: className = '' }: Props = $props();

  let cap = $derived(Math.max(2, Math.floor(primary)));
  let overflowing = $derived(modules.length > cap);
  let visibleCount = $derived(overflowing ? cap - 1 : modules.length);
  let visible = $derived(modules.slice(0, visibleCount));
  let rest = $derived(modules.slice(visibleCount));
  // The More tab is current when the active module lives in the sheet.
  let moreActive = $derived(overflowing && activeIndex >= visibleCount);
  let moreBadge = $derived(rest.some((m) => hasModuleBadge(m)));

  let moreOpen = $state(false);
  const uid = $props.id();
  const moreTitleId = `${uid}-more`;
  const name = (mod: NavModule) => moduleName(mod, { unread: t().appShell.unread, fresh: t().appShell.new });

  /** showModal() on mount; the opener gets focus back when the dialog closes. */
  function modal(dialog: HTMLElement) {
    if (!(dialog instanceof HTMLDialogElement)) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }

  function pick(i: number) {
    moreOpen = false;
    onSelect(i);
  }
</script>

<nav class="ca-bottom-nav glass-chrome-layer {className}" aria-label={t().appShell.moduleNavigation}>
  {#each visible as mod, i}
    <button
      class="ca-bottom-nav__btn"
      class:ca-bottom-nav__btn--active={i === activeIndex}
      type="button"
      aria-label={name(mod)}
      aria-current={i === activeIndex ? 'page' : undefined}
      onclick={() => onSelect(i)}
    >
      <span class="ca-bottom-nav__icon">
        <mod.icon size={22} stroke-width={i === activeIndex ? 2 : 1.5} />
        <NavModuleBadge module={mod} />
      </span>
      <span class="ca-bottom-nav__label">{mod.label}</span>
    </button>
  {/each}
  {#if overflowing}
    <button
      class="ca-bottom-nav__btn"
      class:ca-bottom-nav__btn--active={moreActive}
      type="button"
      aria-current={moreActive ? 'page' : undefined}
      aria-haspopup="dialog"
      aria-label={moreBadge ? `${t().appShell.more}, ${t().appShell.new}` : undefined}
      onclick={() => (moreOpen = true)}
    >
      <span class="ca-bottom-nav__icon">
        <Ellipsis size={22} stroke-width={moreActive ? 2 : 1.5} />
        {#if moreBadge}<NavModuleBadge module={{ ...rest[0], badge: 'dot' }} />{/if}
      </span>
      <span class="ca-bottom-nav__label">{t().appShell.more}</span>
    </button>
  {/if}
</nav>

{#if overflowing && moreSheet}
  {@const Sheet = moreSheet}
  <Sheet
    bind:open={moreOpen}
    title={t().appShell.more}
    {rest}
    {visibleCount}
    {activeIndex}
    {overflow}
    onPick={pick}
  />
{:else if overflowing && moreOpen}
  <!-- Built-in "More": a plain native modal <dialog>. The browser supplies the top layer, the inert
       page, the focus trap, Escape (`close`) and focus restore; a click on the backdrop lands on the
       dialog itself. No exit animation, no swipe, and none of the layer engine in the shell's
       bundle: that is what NavMoreSheet adds. -->
  <dialog
    class="ca-bottom-nav__dialog"
    aria-labelledby={moreTitleId}
    {@attach modal}
    onclose={() => (moreOpen = false)}
    onclick={(e) => { if (e.target === e.currentTarget) moreOpen = false; }}
  >
    <div class="ca-bottom-nav__dialog-head">
      <h2 id={moreTitleId} class="ca-bottom-nav__dialog-title">{t().appShell.more}</h2>
      <button type="button" class="ca-bottom-nav__dialog-close" aria-label={t().appShell.closeMore} onclick={() => (moreOpen = false)}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <ul class="ca-bottom-nav__more" role="list">
      {#each rest as mod, j}
        {@const i = visibleCount + j}
        <li>
          <button
            class="ca-bottom-nav__more-btn"
            class:ca-bottom-nav__more-btn--active={i === activeIndex}
            type="button"
            aria-label={name(mod)}
            aria-current={i === activeIndex ? 'page' : undefined}
            onclick={() => pick(i)}
          >
            <span class="ca-bottom-nav__more-icon">
              <mod.icon size={22} stroke-width={i === activeIndex ? 2 : 1.5} />
              <NavModuleBadge module={mod} />
            </span>
            <span class="ca-bottom-nav__more-label">{mod.label}</span>
          </button>
        </li>
      {/each}
    </ul>
    {#if overflow}
      <div class="ca-bottom-nav__more-extra">{@render overflow()}</div>
    {/if}
  </dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      /* The bar's own background runs through the home-indicator inset: no dark band below it. */
      box-sizing: border-box;
      height: calc(var(--ca-bottom-nav-h) + var(--ca-safe-bottom));
      padding: 0 var(--ca-safe-right) var(--ca-safe-bottom) var(--ca-safe-left);
      display: none;
      flex-direction: row;
      align-items: stretch;
      z-index: var(--ca-z-nav);
      /* Opaque so the safe-area strip matches the bar and Safari 26 tints its toolbar
         from it (it samples background-color of fixed edge elements, not images). */
      background-color: var(--ca-chrome-surface);
      box-shadow: inset 0 var(--ca-border-width) 0 var(--ca-outline-subtle);
    }

    @media (max-width: 899.98px) {
      .ca-bottom-nav {
        display: flex;
      }
    }

    .ca-bottom-nav__btn {
      /* Equal columns that may shrink below content width, so 5 items fit at 320px. */
      flex: 1 1 0;
      min-width: 0;
      min-height: var(--ca-touch-target);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--ca-text-secondary);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
      padding: 0 var(--ca-space-0-5);
      -webkit-tap-highlight-color: transparent;
    }

    .ca-bottom-nav__btn--active {
      color: var(--ca-brand-text);
    }

    .ca-bottom-nav__btn:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    .ca-bottom-nav__icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ca-bottom-nav__label {
      display: block;
      max-width: 100%;
      /* 11px floor: tab labels are read at arm length, never shrunk "to fit". */
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-medium);
      line-height: var(--ca-line-height-tight);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
}
</style>

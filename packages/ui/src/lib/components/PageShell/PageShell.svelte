<script lang="ts">
  import PageBack from './PageBack.svelte';
  import type { Snippet } from 'svelte';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { pageShell } from '../../i18n/groups/pageShell.js';
  import { provideSectionHeadingLevel } from './heading-context.js';
  import { warnNoMain } from '../../utils/warn-no-main.js';
  import type { IconComponent } from '../../types.js';
  import Badge from '../Badge/Badge.svelte';
  import { Ellipsis } from '@lucide/svelte';
  import { measureOverflow, observeOverflow } from '../../utils/overflow.js';
  import IconButton from '../Button/IconButton.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
  const t = useMessages(pageShell);

  interface Props {
    /** `false`: the page does not scroll itself (the window or an outer shell does): no nested scroller, no tab stop, and the bottom clears `--ca-shell-inset-bottom`. @default true */
    scroll?: boolean;
    title?: string;
    /**
     * Icon in a decorative tile before the title. Size and tint: `--ca-page-icon-size` and
     * `--ca-page-icon-bg`.
     */
    icon?: IconComponent;
    /**
     * A count after the title ("Deals, 128"). The number is part of the heading's accessible name (and
     * so of the region's), through its `aria-label` (it starts with the visible title); the visible badge is not announced twice.
     */
    count?: number | string;
    /** Anything else inline with the title, after the count (a status badge, a filter chip). */
    titleExtra?: Snippet;
    /** Display text role for the title: `--ca-display-tracking`, `--ca-display-leading` and the fluid `--ca-font-size-display-3`. */
    display?: boolean;
    description?: string;
    gap?: number;
    maxWidth?: string;
    /**
     * Caps the content column. `reading` is ~46rem (forms, settings: readable line length, inputs
     * that do not stretch edge to edge); `wide` (default) uses the full shell width. With an
     * `aside` the cap applies to the content column and the aside sits next to it.
     */
    width?: 'reading' | 'wide';
    actions?: Snippet;
    /** Renders the standard back link before the title. */
    backHref?: string;
    /** Accessible name of the back link. Default: 'Back' (localized). */
    backLabel?: string;
    /** Runs when the back link is clicked, before it navigates. Call `e.preventDefault()` to take over. */
    onback?: (e: MouseEvent) => void;
    /**
     * Companion column (in-page index, summary, help, preview). Next to the content (sticky) when
     * the shell is wide enough, after the content below that. Rendered as `<aside>`.
     */
    aside?: Snippet;
    /** Accessible name of the `<aside>` landmark. Defaults to "Page sidebar" (localized). */
    asideLabel?: string;
    class?: string;
    children?: Snippet;
  }

  let { scroll = true, title, icon: Icon, count, titleExtra, display = false, description, gap, maxWidth, width = 'wide', actions, backHref, backLabel, onback, aside, asideLabel, class: className = '', children }: Props = $props();
  const titleId = $props.id();
  // The page <h1> is rendered above; titles inside the shell default to <h2>.
  provideSectionHeadingLevel();

  let root = $state<HTMLElement>();
  $effect(() => warnNoMain(root, 'PageShell'));

  // Only caller-supplied values become inline vars; the defaults live in the stylesheet as tokens.
  const rootStyle = $derived(
    [maxWidth ? `--ps-max:${maxWidth}` : '', gap !== undefined ? `--ps-gap:${gap}px` : ''].filter(Boolean).join(';') || undefined,
  );

  // Actions: a `data-priority="primary"` child never leaves the row; the others move into a More menu
  // when the row is too narrow (same mechanics as `Toolbar overflow="menu"`). With no primary
  // action nothing is prioritised, so nothing collapses and the actions wrap as before.
  interface Moved {
    el: HTMLElement;
    label: string;
    disabled: boolean;
  }
  let actionsEl = $state<HTMLElement | null>(null);
  let collapses = $state(false);
  let moved = $state.raw<Moved[]>([]);

  const isPrimary = (el: HTMLElement) => el.dataset.priority === 'primary' || el.querySelector('[data-priority="primary"]') !== null;
  const labelOf = (el: HTMLElement) => el.dataset.overflow || el.getAttribute('aria-label') || el.textContent?.trim() || '';
  /** The row's own children, never the More wrapper. */
  const movable = (row: HTMLElement) =>
    Array.from(row.children).filter((el): el is HTMLElement => el instanceof HTMLElement && !el.classList.contains('ca-page-shell__more'));

  /** Un-hides everything, measures, then hides what does not fit: one synchronous pass, so no flash. */
  function layout(row: HTMLElement) {
    const items = movable(row);
    for (const el of items) el.removeAttribute('data-overflowed');
    const trigger = row.querySelector<HTMLElement>(':scope > .ca-page-shell__more');
    trigger?.removeAttribute('data-shown');
    trigger?.setAttribute('data-measuring', '');
    const reserve = trigger?.getBoundingClientRect().width || 32;
    trigger?.removeAttribute('data-measuring');
    const out = measureOverflow({ items, container: row, reserve, gap: parseFloat(getComputedStyle(row).columnGap) || 0, pinned: isPrimary });
    items.forEach((el, i) => {
      if (out.has(i)) el.setAttribute('data-overflowed', '');
    });
    if (out.size) trigger?.setAttribute('data-shown', '');
    const next = items
      .filter((_, i) => out.has(i))
      .map((el) => ({ el, label: labelOf(el), disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' }));
    const same = next.length === moved.length && next.every((m, i) => m.el === moved[i].el && m.label === moved[i].label && m.disabled === moved[i].disabled);
    if (!same) moved = next;
  }

  // Whether the actions hold a primary one is read from the DOM, since the snippet is opaque.
  $effect(() => {
    const row = actionsEl;
    if (!row) return;
    const sync = () => {
      collapses = movable(row).some(isPrimary);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(row, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-priority'] });
    return () => mo.disconnect();
  });

  $effect(() => {
    const row = actionsEl;
    if (!collapses || !row) {
      moved = [];
      return;
    }
    layout(row);
    return observeOverflow(row, () => movable(row), () => layout(row));
  });
</script>

<!-- The shell is the page's scroll container, named by its title. Focusable in the server
     HTML too (keyboard scrolling before or without hydration); scrollFocusable drops the tab
     stop after hydration when nothing overflows (axe scrollable-region-focusable). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={root}
  class="ca-page-shell {className}"
  style={rootStyle}
  role={scroll || title ? 'region' : undefined}
  aria-labelledby={title ? titleId : undefined}
  tabindex={scroll ? 0 : undefined}
  class:ca-page-shell--flow={!scroll}
  use:scrollFocusable
>
  {#if title || description || actions || backHref || Icon || count !== undefined}
    <div class="ca-page-shell__header">
      {#if backHref}<div class="ca-page-shell__leading"><PageBack href={backHref} label={backLabel} {onback} /></div>{/if}
      {#if Icon}
        <span class="ca-page-shell__icon" aria-hidden="true"><Icon size={22} stroke-width={1.75} /></span>
      {/if}
      <div class="ca-page-shell__meta">
        {#if title}
          <div class="ca-page-shell__heading">
            <h1 class="ca-page-shell__title ca-sr-only--shell" class:ca-page-shell__title--display={display} id={titleId} aria-label={count !== undefined ? `${title}, ${count}` : undefined}>{title}</h1>
            {#if count !== undefined}
              <span class="ca-page-shell__count" aria-hidden="true"><Badge tone="brand" subtle>{count}</Badge></span>
            {/if}
            {#if titleExtra}
              <span class="ca-page-shell__extra">{@render titleExtra()}</span>
            {/if}
          </div>
        {/if}
        {#if description}
          <p class="ca-page-shell__description">{description}</p>
        {/if}
      </div>
      {#if actions}
        <div bind:this={actionsEl} class="ca-page-shell__actions" data-collapse={collapses ? '' : undefined}>
          {@render actions()}
          {#if collapses}
            <span class="ca-page-shell__more">
              <DropdownMenu align="end">
                {#snippet triggerChild(props)}
                  <IconButton {...props} variant="text" size="sm" aria-label={t().pageShell.more}>
                    <Ellipsis size={16} />
                  </IconButton>
                {/snippet}
                {#each moved as item (item.el)}
                  <DropdownMenuItem disabled={item.disabled} onclick={() => item.el.click()}>{item.label}</DropdownMenuItem>
                {/each}
              </DropdownMenu>
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  <div class="ca-page-shell__frame">
    <div class="ca-page-shell__layout" class:ca-page-shell__layout--reading={width === 'reading'} class:ca-page-shell__layout--aside={!!aside}>
      <div class="ca-page-shell__main ca-page-shell__body">
        {@render children?.()}
      </div>
      {#if aside}
        <aside class="ca-page-shell__aside" aria-label={asideLabel ?? t().pageShell.aside}>
          {@render aside()}
        </aside>
      {/if}
    </div>
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-page-shell {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      max-width: var(--ps-max, var(--ca-page-max, calc(var(--ca-space-unit) * 320)));
      width: 100%;
      margin: 0 auto;
      padding: var(--ca-page-pt) var(--ca-page-px) var(--ca-space-12);
      box-sizing: border-box;
    }

    /* scroll={false}: the window (or an outer shell) scrolls; clear what the shell pins at the bottom (#935). */
    .ca-page-shell--flow {
      flex: none;
      overflow: visible;
      padding-bottom: calc(var(--ca-space-12) + var(--ca-shell-inset-bottom, 0px));
    }

    .ca-page-shell__header {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ca-space-4);
      margin-bottom: var(--ps-gap, var(--ca-space-7));
    }

    .ca-page-shell__leading { flex-shrink: 0; }

    /* Row layout (900px and up): the title column never gets narrower than 12rem; the actions give way. */
    .ca-page-shell__meta { flex: 1; min-width: min(12rem, 100%); }

    /* Decorative tile before the title; centred on the first line of text, not on the description. */
    .ca-page-shell__icon {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-page-icon-size, var(--ca-space-10));
      height: var(--ca-page-icon-size, var(--ca-space-10));
      border-radius: var(--ca-radius-md);
      color: var(--ca-brand-text);
      background: var(--ca-page-icon-bg, color-mix(in oklab, var(--ca-brand-main) 14%, transparent));
      line-height: 0;
    }

    /* Title, count and extras on one line; they wrap under each other on a very narrow column. */
    .ca-page-shell__heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: var(--ca-space-2);
      row-gap: var(--ca-space-1);
      margin: 0 0 var(--ca-space-0-5);
    }
    .ca-page-shell__heading > .ca-page-shell__title { margin: 0; }
    .ca-page-shell__count,
    .ca-page-shell__extra { display: inline-flex; align-items: center; flex-shrink: 0; }

    .ca-page-shell__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h5);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0 0 var(--ca-space-0-5);
      line-height: var(--ca-line-height-tight);
    }

    .ca-page-shell__title--display {
      font-size: var(--ca-font-size-display-3);
      letter-spacing: var(--ca-display-tracking);
      line-height: var(--ca-display-leading);
    }

    .ca-page-shell__description {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-relaxed);
    }

    /* The actions never take a width that squeezes the title: they shrink and wrap, and the title
       column keeps at least 12rem before the actions wrap onto their own row. */
    .ca-page-shell__actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex: 0 1 auto;
      min-width: 0;
    }
    /* `data-priority="primary"` in the actions: one line; what does not fit is hidden here and listed in More. */
    .ca-page-shell__actions[data-collapse] {
      flex-wrap: nowrap;
    }
    .ca-page-shell__actions[data-collapse] > :global(*) {
      flex: none;
    }
    .ca-page-shell__actions[data-collapse] > :global([data-overflowed]) {
      display: none;
    }
    .ca-page-shell__more {
      display: none;
      flex: none;
    }
    .ca-page-shell__more:global([data-shown]),
    .ca-page-shell__more:global([data-measuring]) {
      display: inline-flex;
    }

    .ca-page-shell__body {
      display: flex;
      flex-direction: column;
      gap: var(--ps-gap, var(--ca-space-7));
      width: 100%;
    }

    /* The frame is the container: the aside moves beside the content when the SHELL is wide
       (it shares the viewport with the rail and panel), not when the viewport is. */
    .ca-page-shell__frame { container-type: inline-size; }

    .ca-page-shell__layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ps-gap, var(--ca-space-7));
      align-items: start;
    }

    .ca-page-shell__layout--reading { grid-template-columns: minmax(0, var(--ca-reading-width, 46rem)); justify-content: center; }

    .ca-page-shell__aside {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-4);
    }

    @container (min-width: 60rem) {
      .ca-page-shell__layout--aside {
        grid-template-columns: minmax(0, 1fr) var(--ca-aside-width, 17rem);
      }
      .ca-page-shell__layout--aside.ca-page-shell__layout--reading {
        grid-template-columns: minmax(0, var(--ca-reading-width, 46rem)) var(--ca-aside-width, 17rem);
      }
      .ca-page-shell__aside {
        position: sticky;
        top: 0;
      }
    }

    @media (max-width: 599.98px) {
      .ca-page-shell {
        padding: var(--ca-space-5) var(--ca-page-px-sm) var(--ca-space-10);
      }
    }

    /* Mobile: description leads, actions wrap below it. Labeled buttons share the row
       full-width (big tap targets); everything else (icon controls, StatusChip, Chip,
       Badge, text) keeps its natural size and stays at the end, so a lone
       ThemeToggle/IconButton/StatusChip never stretches or centres. */
    @media (max-width: 899.98px) {
      .ca-page-shell__header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--ca-space-3);
      }
      .ca-page-shell__actions {
        flex-shrink: 1;
        flex-wrap: wrap;
        justify-content: flex-end;
        width: 100%;
      }
      .ca-page-shell__actions > :global(.ca-btn) {
        flex: 1 1 auto;
      }
      /* .ca-rail-btn is width:100% by default (rail slot); here it is an icon control. */
      .ca-page-shell__actions > :global(.ca-rail-btn) {
        width: auto;
      }
    }
}
</style>

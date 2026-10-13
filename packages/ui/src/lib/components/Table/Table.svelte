<script lang="ts">
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  interface Props {
    children?:   Snippet;
    class?:      string;
    /**
     * `scroll` (default): regular table. `cards`: when its own width is below the `sm` breakpoint (600px)
     * each row becomes a card. Each cell's caption is its column header; set `data-label` on a
     * `<td>` only to override it.
     */
    responsive?: 'scroll' | 'cards';
  }
  let { children, class: className = '', responsive = 'scroll' }: Props = $props();

  /** Cards mode: caption every cell with its column header unless the author set one. Re-runs
      when rows change (sorting, paging, filtering), so new rows are captioned too. */
  function headerLabels(table: HTMLTableElement) {
    if (responsive !== 'cards') return;
    const label = () => {
      const heads = [...table.querySelectorAll('thead tr:last-child th')].map((th) => th.textContent?.trim() ?? '');
      for (const row of table.querySelectorAll('tbody tr')) {
        [...row.children].forEach((cell, i) => {
          if (cell instanceof HTMLTableCellElement && !cell.hasAttribute('data-label') && heads[i])
            cell.dataset.label = heads[i];
        });
      }
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(table, { childList: true, subtree: true });
    return () => mo.disconnect();
  }
</script>

<!-- Focusable scroll region in the server HTML too (keyboard scrolling works without JS);
     scrollFocusable drops the tab stop after hydration when nothing overflows.
     A focusable scroll region is the WCAG-recommended pattern (axe scrollable-region-focusable). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="ca-table-root {className}"
  class:ca-table-root--cards={responsive === 'cards'}
  role="region"
  aria-label={t().table.scrollRegion}
  tabindex="0"
  use:scrollFocusable
>
  <table class="ca-table" class:ca-table--cards={responsive === 'cards'} {@attach headerLabels}>
    {@render children?.()}
  </table>
</div>

<style>
  .ca-table-root {
    width: 100%;
    container-type: inline-size;
    /* It is a focusable scroll region (role=region, tabindex=0): wide tables scroll here,
       never the page. Vertical scrolling stays with the parent (AppList body). */
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }

  /* The table draws its own frame (separate borders so the radius clips); cards mode drops it
     because each card is framed instead. */
  .ca-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
    overflow: clip; /* clip, not hidden: hidden would make the table the sticky thead's scroller */
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }

  /* Sticky thead: stays visible while body rows scroll */
  .ca-table :global(thead) {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--ca-surface-base);
  }

  .ca-table :global(th) { border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle); }

  .ca-table :global(th) {
    padding: var(--ca-space-2-5) var(--ca-space-5);
    text-align: left;
    font-size: var(--ca-font-size-micro);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--ca-overline-tracking);
    white-space: nowrap;
    background: var(--ca-surface-base);
  }

  .ca-table :global(td) {
    padding: calc(var(--ca-space-3) + var(--ca-border-width)) var(--ca-space-5);
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    color: var(--ca-text-secondary);
  }

  .ca-table :global(tbody tr:last-child td) { border-bottom: none; }

  /* Column balance: short tokens (names, enums) stay on one line, long code (type signatures)
     may wrap at spaces, and prose cells keep a readable measure instead of one word per line.
     When the sum does not fit, the root scrolls; nothing is crushed. */
  .ca-table :global(td code) { white-space: normal; overflow-wrap: normal; word-break: keep-all; }
  .ca-table :global(td:first-child code) { white-space: nowrap; }

  .ca-table :global(tbody tr:hover td) {
    background: color-mix(in oklab, var(--ca-brand-main) 4%, transparent);
    cursor: pointer;
  }

  .ca-table :global(td.primary),
  .ca-table :global(th.primary) {
    color: var(--ca-text-primary);
  }

  .ca-table :global(.ca-table-empty) {
    text-align: center;
    padding: var(--ca-space-16) var(--ca-space-5);
    color: var(--ca-text-hint);
    font-size: var(--ca-font-size-button);
  }

  /* Narrow slot, scroll mode: tighter gutters so more columns fit before the region scrolls. */
  @container (max-width: 599.98px) {
    .ca-table:not(.ca-table--cards) :global(th),
    .ca-table:not(.ca-table--cards) :global(td) { padding-inline: var(--ca-space-3); }
  }

  /* ── Cards mode (slot narrower than sm = 600px): a 4-column table still fits a
     reading column (~840px), so cards only take over where columns would crush. ── */
  @container (max-width: 599.98px) {
    .ca-table--cards { border: none; border-radius: 0; overflow: visible; }

    .ca-table--cards,
    .ca-table--cards :global(tbody),
    .ca-table--cards :global(tr),
    .ca-table--cards :global(td) {
      display: block;
    }

    /* header row hidden visually, kept for assistive tech */
    .ca-table--cards :global(thead) {
      position: absolute;
      width: var(--ca-border-width);
      height: var(--ca-border-width);
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    /* One label track shared by every row of the card (subgrid): labels take the width of the
       longest one, values start on the same line, and nothing leaves a 40% hole. */
    .ca-table--cards :global(tbody tr) {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: var(--ca-space-1) var(--ca-space-6);
      padding: var(--ca-space-3) var(--ca-space-4);
      margin-bottom: var(--ca-space-2);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-base);
    }

    .ca-table--cards :global(tbody td) {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: subgrid;
      /* Center: a label beside a two-line value (avatar + name + email) sits on its middle. */
      align-items: center;
      padding: var(--ca-space-1) 0;
      border-bottom: none;
    }

    .ca-table--cards :global(tbody td[data-label])::before {
      content: attr(data-label);
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-hint);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
    }

    /* Values keep their intrinsic width (a code chip must not stretch into a field). */
    .ca-table--cards :global(tbody td > *) { justify-self: start; max-width: 100%; }
    /* In a card there is no column to scroll: long identifiers break instead of overflowing. */
    .ca-table--cards :global(td code) { white-space: normal; overflow-wrap: anywhere; }

    /* The first column identifies the row (name, avatar, id): it heads the card full width,
       without its caption, above a divider; the remaining columns are label/value pairs. */
    .ca-table--cards :global(tbody td:first-child) {
      grid-template-columns: 1fr;
      padding-bottom: var(--ca-space-3);
      margin-bottom: var(--ca-space-2);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      color: var(--ca-text-primary);
    }
    .ca-table--cards :global(tbody td:first-child)::before { display: none; }

    .ca-table--cards :global(tbody td:not([data-label])) {
      grid-template-columns: 1fr;
      grid-column: 1 / -1;
    }

    .ca-table--cards :global(tbody tr:hover td) { background: transparent; }
    .ca-table--cards :global(tbody tr:hover) {
      background: color-mix(in oklab, var(--ca-brand-main) 4%, transparent);
      cursor: pointer;
    }

    .ca-table--cards :global(.ca-table-empty) {
      display: block;
      padding: var(--ca-space-12) var(--ca-space-4);
    }
  }
</style>

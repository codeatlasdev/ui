<script lang="ts">
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { table } from '../../i18n/groups/table.js';
  import type { Snippet } from 'svelte';
  const t = useMessages(table);
  interface Props {
    children?:   Snippet;
    class?:      string;
    /**
     * `scroll` (default): regular table. `cards`: when its own width is below the `sm` breakpoint (600px)
     * each row becomes a card. Each cell's caption is its column header; set `data-label` on a
     * `<td>` only to override it.
     */
    responsive?: 'scroll' | 'cards';
    /** Loading placeholder: the table keeps its exact box (rows stay laid out, hidden) and is announced as busy. Pass the same rows you will show, or placeholder rows, so the height matches. */
    skeleton?: boolean;
    /** `compact`: rows of at most 40px (spreadsheet-like, thousands of rows). `default` keeps the roomy rows. */
    density?: 'default' | 'compact';
    /** `false` drops the table's own border and radius, for a table inside an already framed panel. */
    frame?: boolean;
    /**
     * `x` (default): the root is a focusable, horizontally scrolling region. `none`: the root is
     * `overflow: visible` and the caller owns scrolling, so the sticky header sticks to the page or
     * panel that scrolls vertically.
     */
    scroll?: 'x' | 'none';
    /** Pins the first N columns to the left while the table scrolls horizontally (checkbox + primary column). Needs `scroll="none"` inside a scroller you own, or the default `x`. */
    stickyColumns?: number;
    /** `upper` (default): micro uppercase labels. `sentence`: regular-size labels in their own case. */
    headerCase?: 'upper' | 'sentence';
  }
  let {
    children,
    class: className = '',
    responsive = 'scroll',
    skeleton = false,
    density = 'default',
    frame = true,
    scroll = 'x',
    stickyColumns = 0,
    headerCase = 'upper',
  }: Props = $props();

  /** Cards mode: caption every cell with its column header unless the author set one. Re-runs
      when rows change (sorting, paging, filtering), so new rows are captioned too. */
  /** Pinned columns: column N sits at the summed width of the N-1 before it. Widths change with
      content, so they are measured and written as `--ca-pin-N` (a dynamic custom property). */
  function pinOffsets(table: HTMLTableElement) {
    const n = Math.max(0, Math.floor(stickyColumns));
    if (n === 0 || responsive === 'cards') return;
    const measure = () => {
      const cells = table.querySelector('thead tr:last-child, tbody tr')?.children;
      if (!cells) return;
      let left = 0;
      for (let i = 0; i < n && i < cells.length; i++) {
        table.style.setProperty(`--ca-pin-${i + 1}`, `${left}px`);
        left += cells[i].getBoundingClientRect().width;
      }
    };
    const ro = new ResizeObserver(measure);
    const watch = () => {
      ro.disconnect();
      for (const c of table.querySelector('thead tr:last-child, tbody tr')?.children ?? []) ro.observe(c);
    };
    const mo = new MutationObserver(() => { watch(); measure(); });
    mo.observe(table, { childList: true, subtree: true });
    watch();
    measure();
    return () => {
      ro.disconnect();
      mo.disconnect();
      for (let i = 1; i <= n; i++) table.style.removeProperty(`--ca-pin-${i}`);
    };
  }

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
     A focusable scroll region is the WCAG-recommended pattern (axe scrollable-region-focusable).
     scroll="none": the caller owns scrolling, so the root is a plain wrapper (no region, no tab stop). -->
{#if scroll === 'none'}
  <div
    class="ca-table-root ca-table-root--static {className}"
    class:ca-table-root--cards={responsive === 'cards'}
    aria-busy={skeleton ? 'true' : undefined}
  >
    {@render grid()}
  </div>
{:else}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="ca-table-root {className}"
    class:ca-table-root--cards={responsive === 'cards'}
    role="region"
    aria-label={t().table.scrollRegion}
    tabindex="0"
    aria-busy={skeleton ? 'true' : undefined}
    use:scrollFocusable
  >
    {@render grid()}
  </div>
{/if}

{#snippet grid()}
  <table
    class="ca-table"
    class:ca-table--cards={responsive === 'cards'}
    class:ca-table--compact={density === 'compact'}
    class:ca-table--bare={!frame}
    class:ca-table--pinned={stickyColumns > 0 && responsive !== 'cards'}
    class:ca-table--sentence={headerCase === 'sentence'}
    data-pin={stickyColumns > 0 ? Math.floor(stickyColumns) : undefined}
    data-skeleton={skeleton ? '' : undefined}
    {@attach headerLabels}
    {@attach pinOffsets}
  >
    {@render children?.()}
  </table>
{/snippet}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-table-root {
      width: 100%;
      container-type: inline-size;
      /* It is a focusable scroll region (role=region, tabindex=0): wide tables scroll here,
         never the page. Vertical scrolling stays with the parent (AppList body). */
      overflow-x: auto;
      overscroll-behavior-x: contain;
    }

    /* scroll="none": the caller owns scrolling; sticky thead/columns stick to that scroller. */
    .ca-table-root--static { overflow: visible; container-type: normal; }

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


    /* ── Frameless (inside an already framed panel) ── */
    .ca-table--bare { border: none; border-radius: 0; overflow: visible; }

    /* ── Compact density: rows <= 40px, tokens only ── */
    .ca-table--compact { font-size: var(--ca-font-size-body2); }
    .ca-table--compact :global(th) { padding-block: var(--ca-space-1-5); }
    .ca-table--compact :global(td) {
      padding: var(--ca-space-2) var(--ca-space-3);
      line-height: var(--ca-line-height-snug);
    }
    .ca-table--compact :global(th) { padding-inline: var(--ca-space-3); }

    /* ── Sentence-case header labels ── */
    .ca-table--sentence :global(th) {
      font-size: var(--ca-font-size-label);
      text-transform: none;
      letter-spacing: normal;
    }

    /* ── Sortable header button (TableSortHeader) ── */
    .ca-table :global(.ca-table-sort) {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      min-height: var(--ca-space-6);
      padding: 0 var(--ca-space-1-5);
      margin-inline-start: calc(-1 * var(--ca-space-1-5));
      border: none;
      border-radius: var(--ca-radius-sm);
      background: transparent;
      color: inherit;
      font: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
      cursor: pointer;
    }
    .ca-table :global(.ca-table-sort:hover) { background: var(--ca-action-hover); color: var(--ca-text-primary); }
    .ca-table :global(th[aria-sort] .ca-table-sort) { color: var(--ca-text-primary); }
    .ca-table :global(.ca-table-sort__icon) { flex: none; opacity: 0.4; }
    .ca-table :global(th[aria-sort] .ca-table-sort__icon) { opacity: 1; }

    /* ── Group (section) rows: spans every column, sticky to the left ── */
    .ca-table :global(tr.ca-table-group > th) {
      padding: 0;
      text-transform: none;
      letter-spacing: normal;
      font-size: var(--ca-font-size-label);
      color: var(--ca-text-secondary);
      background: var(--ca-surface-sunken, var(--ca-surface-base));
    }
    .ca-table :global(.ca-table-group__toggle) {
      position: sticky;
      inset-inline-start: 0;
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      width: max-content;
      min-height: var(--ca-space-8);
      padding: 0 var(--ca-space-3);
      border: none;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .ca-table :global(.ca-table-group__toggle:focus-visible) { outline-offset: calc(-1 * var(--ca-focus-ring-offset)); }
    .ca-table :global(.ca-table-group__chevron) { transition: transform var(--ca-duration-fast) var(--ca-ease-standard); }
    .ca-table :global(.ca-table-group__toggle[aria-expanded='false'] .ca-table-group__chevron) { transform: rotate(-90deg); }
    .ca-table :global(tr.ca-table-group:hover > th) { background: var(--ca-surface-sunken, var(--ca-surface-base)); }

    /* ── Interactive rows (TableRow with onactivate) ──
       The pin background below is an opaque base; hover/selected/focus tint it with a color-mix so a
       pinned cell never turns transparent over scrolled content. */
    .ca-table { --ca-table-row-bg: var(--ca-surface-base); }
    .ca-table :global(tr.ca-table-row--interactive) { cursor: pointer; }
    .ca-table :global(tr.ca-table-row--interactive:focus-visible) {
      outline: 2px solid var(--ca-focus-ring);
      outline-offset: -2px;
      border-radius: 0;
    }
    .ca-table :global(tbody tr:hover) { --ca-table-row-bg: color-mix(in oklab, var(--ca-brand-main) 4%, var(--ca-surface-base)); }
    .ca-table :global(tbody tr[aria-selected='true']) { --ca-table-row-bg: color-mix(in oklab, var(--ca-brand-main) 10%, var(--ca-surface-base)); }
    .ca-table :global(tbody tr[aria-selected='true']:hover) { --ca-table-row-bg: color-mix(in oklab, var(--ca-brand-main) 14%, var(--ca-surface-base)); }
    .ca-table :global(tbody tr[aria-selected='true'] td) { background: var(--ca-table-row-bg); }
    .ca-table :global(tbody tr.ca-table-row--interactive:focus-visible) { --ca-table-row-bg: color-mix(in oklab, var(--ca-focus-ring) 8%, var(--ca-surface-base)); }

    /* ── Pinned columns: first N cells of every row (header, body, group-less) ── */
    .ca-table--pinned[data-pin='1'] :global(:is(th, td):nth-child(1)),
    .ca-table--pinned[data-pin='2'] :global(:is(th, td):nth-child(-n + 2)),
    .ca-table--pinned[data-pin='3'] :global(:is(th, td):nth-child(-n + 3)),
    .ca-table--pinned[data-pin='4'] :global(:is(th, td):nth-child(-n + 4)),
    .ca-table--pinned[data-pin='5'] :global(:is(th, td):nth-child(-n + 5)),
    .ca-table--pinned[data-pin='6'] :global(:is(th, td):nth-child(-n + 6)) {
      position: sticky;
      z-index: 1;
    }
    .ca-table--pinned :global(:is(th, td):nth-child(1)) { inset-inline-start: var(--ca-pin-1, 0); }
    .ca-table--pinned :global(:is(th, td):nth-child(2)) { inset-inline-start: var(--ca-pin-2, 0); }
    .ca-table--pinned :global(:is(th, td):nth-child(3)) { inset-inline-start: var(--ca-pin-3, 0); }
    .ca-table--pinned :global(:is(th, td):nth-child(4)) { inset-inline-start: var(--ca-pin-4, 0); }
    .ca-table--pinned :global(:is(th, td):nth-child(5)) { inset-inline-start: var(--ca-pin-5, 0); }
    .ca-table--pinned :global(:is(th, td):nth-child(6)) { inset-inline-start: var(--ca-pin-6, 0); }
    /* Opaque paint for pinned body cells in every row state; header cells keep the thead surface and
       sit above the pinned body cells. */
    .ca-table--pinned :global(tbody td) { background: var(--ca-table-row-bg); }
    .ca-table--pinned :global(thead th) { z-index: 3; }
    /* The last pinned column gets a hairline so scrolled content reads as passing under it. */
    .ca-table--pinned[data-pin='1'] :global(:is(th, td):nth-child(1)),
    .ca-table--pinned[data-pin='2'] :global(:is(th, td):nth-child(2)),
    .ca-table--pinned[data-pin='3'] :global(:is(th, td):nth-child(3)),
    .ca-table--pinned[data-pin='4'] :global(:is(th, td):nth-child(4)),
    .ca-table--pinned[data-pin='5'] :global(:is(th, td):nth-child(5)),
    .ca-table--pinned[data-pin='6'] :global(:is(th, td):nth-child(6)) {
      box-shadow: inset calc(-1 * var(--ca-border-width)) 0 0 var(--ca-outline-subtle);
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
}
</style>

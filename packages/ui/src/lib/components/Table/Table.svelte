<script lang="ts">
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  interface Props {
    children?:   Snippet;
    class?:      string;
    /**
     * `scroll` (default): regular table. `cards`: below the `md` breakpoint (900px)
     * each row becomes a card; give each `<td>` a `data-label` to show its column name.
     */
    responsive?: 'scroll' | 'cards';
  }
  let { children, class: className = '', responsive = 'scroll' }: Props = $props();
</script>

<!-- Focusable scroll region in the server HTML too (keyboard scrolling works without JS);
     scrollFocusable drops the tab stop after hydration when nothing overflows.
     A focusable scroll region is the WCAG-recommended pattern (axe scrollable-region-focusable). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="ca-table-wrap {className}"
  class:ca-table-wrap--cards={responsive === 'cards'}
  role="region"
  aria-label={t().table.scrollRegion}
  tabindex="0"
  use:scrollFocusable
>
  <table class="ca-table" class:ca-table--cards={responsive === 'cards'}>
    {@render children?.()}
  </table>
</div>

<style>
  .ca-table-wrap {
    width: 100%;
    container-type: inline-size;
    /* no overflow here: the parent AppList body scrolls */
  }

  .ca-table {
    width: 100%;
    border-collapse: collapse;
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

  .ca-table :global(thead tr) {
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
  }

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

  /* ── Cards mode (slot narrower than md = 900px) ─────────────── */
  @container (max-width: 899.98px) {
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

    .ca-table--cards :global(tbody tr) {
      display: grid;
      gap: var(--ca-space-1);
      padding: var(--ca-space-3) var(--ca-space-4);
      margin-bottom: var(--ca-space-2);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-md);
      background: var(--ca-surface-base);
    }

    .ca-table--cards :global(tbody td) {
      display: grid;
      grid-template-columns: minmax(var(--ca-space-20), 40%) 1fr;
      gap: var(--ca-space-3);
      align-items: baseline;
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

    .ca-table--cards :global(tbody td:not([data-label])) {
      grid-template-columns: 1fr;
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

<script lang="ts">
  /**
   * RecordList: records as dense rows (identity | a few columns | row menu) that re-flow to a
   * two-line stacked row on a phone. It owns the flush container, the row separators, the shared
   * column template of the header and every row, the re-flow and the 44px actions cell.
   *
   *   <RecordList columns="minmax(0,1.2fr) minmax(0,1.6fr) 5rem" actions labels={['App', 'Scopes', 'Installs']} aria-label="Apps">
   *     {#each apps as app (app.id)}
   *       <RecordRow>
   *         {#snippet identity()}{app.name}{/snippet}
   *         <RecordCell label="Scopes">{app.scopes}</RecordCell>
   *         <RecordCell label="Installs">{app.installs}</RecordCell>
   *         {#snippet actions()}<DropdownMenu>…</DropdownMenu>{/snippet}
   *       </RecordRow>
   *     {/each}
   *   </RecordList>
   *
   * `columns` is one `grid-template-columns` value: identity first, one track per `RecordCell`.
   * With `actions` the list appends the actions track (`var(--ca-touch-target)`, the width of the
   * actions cell); without it, write that track yourself as the last one, as `var(--ca-touch-target)`,
   * never a rem size (`2.75rem` is 41px at this library's 15px root). `labels` are the column headers of the identity and the cells (not the
   * actions): wide, they are an `aria-hidden` header row; stacked, the header is gone and each
   * `RecordCell` paints its own `label`. The re-flow follows the list's own width (container query,
   * 36rem), not the viewport, so it behaves the same in a narrow card or beside a sidebar.
   * With no rows, render your own empty state instead of the list.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children'> {
    /** `grid-template-columns` shared by the header and every row: identity, then one track per cell (and the actions track unless `actions` is set). */
    columns: string;
    /** Appends the actions track (`var(--ca-touch-target)`) to `columns` for the header and every row. Set it when the rows pass `actions`. */
    actions?: boolean;
    /** Column headers for the identity and each cell, in order. Omit for no header row. */
    labels?: string[];
    class?: string;
    /** The `RecordRow`s. */
    children?: Snippet;
  }

  let { columns, actions = false, labels, class: className = '', children, ...rest }: Props = $props();

  const template = $derived(actions ? `${columns} var(--ca-touch-target)` : columns);

  // A last track narrower than the actions cell does not error: the cell overflows it by a few px.
  let root = $state<HTMLElement>();
  $effect(() => {
    void template;
    const row = root?.querySelector<HTMLElement>('.ca-record-row:has(.ca-record-row__actions)');
    if (!row) return;
    const cell = row.querySelector<HTMLElement>('.ca-record-row__actions')!;
    const tracks = getComputedStyle(row).gridTemplateColumns.split(' ');
    const last = Number.parseFloat(tracks[tracks.length - 1] ?? '');
    // Stacked rows (container query) use their own two-track template: nothing to check there.
    if (tracks.length < 2 || getComputedStyle(row).gridTemplateAreas !== 'none') return;
    if (last + 0.5 < cell.getBoundingClientRect().width)
      devWarn(
        'record-list-actions-track',
        '<RecordList> last column is narrower than the actions cell (--ca-touch-target). Pass `actions` and drop the last track from `columns`, or end `columns` with var(--ca-touch-target); a rem size such as 2.75rem is 41px at this library\'s 15px root.'
      );
  });
</script>

<div bind:this={root} class="ca-record-list {className}" style:--ca-record-columns={template}>
  {#if labels?.length}
    <div class="ca-record-list__head" aria-hidden="true">
      {#each labels as label (label)}
        <span data-column>{label}</span>
      {/each}
    </div>
  {/if}
  <ul class="ca-record-list__body" {...rest}>
    {@render children?.()}
  </ul>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-record-list {
      container-type: inline-size;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-lg);
      background: var(--ca-surface-base);
      color: var(--ca-text-primary);
    }

    .ca-record-list__body {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .ca-record-list__head {
      display: grid;
      grid-template-columns: var(--ca-record-columns);
      align-items: center;
      column-gap: var(--ca-space-4);
      padding: var(--ca-space-2) var(--ca-space-4);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-hint);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
    }

    .ca-record-list__head > :global([data-column]) { min-width: 0; }

    /* The list's own width decides, like Table cards mode: header gone, rows stacked. */
    @container (max-width: 35.99rem) {
      .ca-record-list__head { display: none; }
    }
}
</style>

<script lang="ts">
  /**
   * RecordList: records as dense rows (identity | a few columns | row menu) that re-flow to a
   * two-line stacked row on a phone. It owns the flush container, the row separators, the shared
   * column template of the header and every row, the re-flow and the 44px actions cell.
   *
   *   <RecordList columns="minmax(0,1.2fr) minmax(0,1.6fr) 5rem 2.75rem" labels={['App', 'Scopes', 'Installs']} aria-label="Apps">
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
   * `columns` is one `grid-template-columns` value: identity first, one track per `RecordCell`,
   * the actions track last. `labels` are the column headers of the identity and the cells (not the
   * actions): wide, they are an `aria-hidden` header row; stacked, the header is gone and each
   * `RecordCell` paints its own `label`. The re-flow follows the list's own width (container query,
   * 36rem), not the viewport, so it behaves the same in a narrow card or beside a sidebar.
   * With no rows, render your own empty state instead of the list.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children'> {
    /** `grid-template-columns` shared by the header and every row: identity, one track per cell, then actions. */
    columns: string;
    /** Column headers for the identity and each cell, in order. Omit for no header row. */
    labels?: string[];
    class?: string;
    /** The `RecordRow`s. */
    children?: Snippet;
  }

  let { columns, labels, class: className = '', children, ...rest }: Props = $props();
</script>

<div class="ca-record-list {className}" style:--ca-record-columns={columns}>
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

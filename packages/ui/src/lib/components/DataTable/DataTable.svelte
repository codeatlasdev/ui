<script lang="ts" generics="TData extends RowData">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import {
    FlexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type Updater,
    type RowData,
  } from '@tanstack/svelte-table';
  import { SearchX } from '@lucide/svelte';
  import { caTableFeatures, createCaTable } from './table-hook.svelte.js';
  import DataTableToolbar from './DataTableToolbar.svelte';
  import DataTablePagination from './DataTablePagination.svelte';

  interface Props {
    columns:               ColumnDef<typeof caTableFeatures, TData>[];
    data:                  TData[];

    // ── Server mode (all optional; if omitted, state is managed internally) ──
    total?:                number;
    globalFilter?:         string;
    onGlobalFilterChange?: (v: string) => void;
    pagination?:           PaginationState;
    onPaginationChange?:   (v: Updater<PaginationState>) => void;
    sorting?:              SortingState;
    onSortingChange?:      (v: Updater<SortingState>) => void;

    // ── Common ───────────────────────────────────────────────────────────────
    /** Shown when truly empty (no active filter) */
    emptyState?:           Snippet;
    /** Filter chips: DataTableFacetedFilter components */
    children?:             Snippet;
    onRowClick?:           (row: TData) => void;
    searchPlaceholder?:    string;
    isLoading?:            boolean;
    isExporting?:          boolean;
    onExport?:             () => void;
    hasActiveFilters?:     boolean;
    class?:                string;

    // ── i18n ─────────────────────────────────────────────────────────────────
    labels?: {
      noResults?:    string;
      noResultsSub?: string;
      clearSearch?:  string;
    };
  }

  let {
    columns,
    data,
    total,
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    emptyState,
    children,
    onRowClick,
    searchPlaceholder,
    isLoading,
    isExporting,
    onExport,
    hasActiveFilters,
    class: className = '',
    labels,
  }: Props = $props();

  // ── Simple vs server mode ─────────────────────────────────────────────────
  // Simple mode: none of the controlled props were passed in.
  const isSimple = $derived(globalFilter === undefined);

  // Internal state for simple mode
  let _filter     = $state('');
  let _pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
  let _sorting    = $state<SortingState>([]);

  // Resolved values: use internal or external
  const resolvedFilter     = $derived(isSimple ? _filter     : (globalFilter ?? ''));
  const resolvedPagination = $derived(isSimple ? _pagination : (pagination ?? { pageIndex: 0, pageSize: 10 }));
  const resolvedSorting    = $derived(isSimple ? _sorting    : (sorting ?? []));

  // In simple mode, filter + sort + paginate data locally
  const resolvedData = $derived.by(() => {
    if (!isSimple) return data;

    const q = resolvedFilter.trim().toLowerCase();
    let rows = q
      ? data.filter(row =>
          Object.values(row as Record<string, unknown>).some(v =>
            v != null && String(v).toLowerCase().includes(q)
          )
        )
      : data;

    if (resolvedSorting.length > 0) {
      const { id, desc } = resolvedSorting[0];
      rows = [...rows].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[id] ?? '');
        const bv = String((b as Record<string, unknown>)[id] ?? '');
        return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      });
    }
    return rows;
  });

  const resolvedTotal = $derived(isSimple ? resolvedData.length : (total ?? data.length));

  // Page slice for simple mode
  const resolvedPageData = $derived(
    isSimple
      ? resolvedData.slice(
          resolvedPagination.pageIndex * resolvedPagination.pageSize,
          (resolvedPagination.pageIndex + 1) * resolvedPagination.pageSize
        )
      : data
  );

  // ── Callbacks ─────────────────────────────────────────────────────────────
  function handleFilterChange(v: string) {
    if (isSimple) { _filter = v; _pagination = { ..._pagination, pageIndex: 0 }; }
    else onGlobalFilterChange?.(v);
  }

  function handlePaginationChange(v: Updater<PaginationState>) {
    if (isSimple) _pagination = typeof v === 'function' ? v(_pagination) : v;
    else onPaginationChange?.(v);
  }

  function handleSortingChange(v: Updater<SortingState>) {
    if (isSimple) _sorting = typeof v === 'function' ? v(_sorting) : v;
    else onSortingChange?.(v);
  }

  // ── Table instance ────────────────────────────────────────────────────────
  const table = createCaTable({
    get columns()            { return columns; },
    get data()               { return resolvedPageData; },
    get manualFiltering()  { return !isSimple; },
    get manualPagination() { return !isSimple; },
    get manualSorting()    { return !isSimple; },
    get rowCount()           { return resolvedTotal; },
    // DataTable owns pagination state and slices `data` per page itself: the
    // table must not treat each page change as a data change and reset to page 0.
    autoResetPageIndex: false,
    state: {
      get globalFilter()   { return resolvedFilter; },
      get pagination()     { return resolvedPagination; },
      get sorting()        { return resolvedSorting; },
    },
    onGlobalFilterChange: (v) =>
      handleFilterChange(typeof v === 'function' ? v(resolvedFilter) : v),
    onPaginationChange:   handlePaginationChange,
    onSortingChange:      handleSortingChange,
  });

  const rows         = $derived(table.getRowModel().rows);
  const isEmpty      = $derived(rows.length === 0);
  const isFiltered   = $derived(!!(resolvedFilter || hasActiveFilters));
  const headerGroups = $derived(table.getHeaderGroups());
</script>

<div class="ca-datatable {className}">
  <DataTableToolbar
    {table}
    total={resolvedTotal}
    globalFilter={resolvedFilter}
    onGlobalFilterChange={handleFilterChange}
    {searchPlaceholder}
    {isLoading}
    {isExporting}
    {onExport}
  >
    {@render children?.()}
  </DataTableToolbar>

  {#if isEmpty && !isFiltered && emptyState}
    <!-- Virgin empty: surface panel, no header row -->
    <div class="ca-datatable__empty-panel">
      {@render emptyState()}
    </div>
  {:else}
    <div class="ca-datatable__glass">
      <div class="ca-datatable__scroll">
        <table class="ca-datatable__table">
          <thead class="ca-datatable__thead">
            {#each headerGroups as hg (hg.id)}
              <tr>
                {#each hg.headers as header (header.id)}
                  <th
                    scope="col"
                    aria-sort={header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : undefined}
                  >
                    {#if !header.isPlaceholder}
                      <FlexRender {header} />
                    {/if}
                  </th>
                {/each}
              </tr>
            {/each}
          </thead>
          <tbody class="ca-datatable__tbody">
            {#if isEmpty}
              <tr>
                <td class="ca-datatable__no-results" colspan={columns.length}>
                  <div class="ca-datatable__no-results-inner">
                    <div class="ca-datatable__no-results-icon">
                      <SearchX size={20} stroke-width={1.5} />
                    </div>
                    <p class="ca-datatable__no-results-title">
                      {labels?.noResults ?? t().dataTable.noResults}
                    </p>
                    <p class="ca-datatable__no-results-sub">
                      {labels?.noResultsSub ?? t().dataTable.noResultsSub}
                    </p>
                    {#if resolvedFilter}
                      <button
                        class="ca-datatable__clear"
                        onclick={() => handleFilterChange('')}
                        type="button"
                      >{labels?.clearSearch ?? t().dataTable.clearSearch}</button>
                    {/if}
                  </div>
                </td>
              </tr>
            {:else}
              {#each rows as row (row.id)}
                <tr
                  class:ca-datatable__row--clickable={!!onRowClick}
                  onclick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {#each row.getVisibleCells() as cell (cell.id)}
                    <td><FlexRender {cell} /></td>
                  {/each}
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <DataTablePagination {table} total={resolvedTotal} />
</div>

<style>
  .ca-datatable {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    flex: 1;
  }

  /* ── Surface container ────────────────────────────────────────────────── */
  .ca-datatable__glass {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border-radius: var(--ca-radius-lg);
    border: 1px solid var(--ca-outline-subtle);
    background: var(--ca-surface-raised);
  }

  .ca-datatable__scroll { width: 100%; overflow-x: auto; }

  /* ── Table ────────────────────────────────────────────────────────────── */
  .ca-datatable__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--ca-font-size-body2);
  }

  .ca-datatable__thead tr {
    border-bottom: 1px solid var(--ca-outline-subtle);
  }

  .ca-datatable__thead th {
    height: 36px;
    padding: 0 12px;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
  }

  .ca-datatable__tbody tr {
    border-bottom: 1px solid var(--ca-outline-subtle);
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-datatable__tbody tr:last-child { border-bottom: none; }

  .ca-datatable__tbody tr:hover { background: var(--ca-action-hover); }

  .ca-datatable__row--clickable { cursor: pointer; }

  .ca-datatable__tbody td {
    padding: 10px 12px;
    vertical-align: middle;
    white-space: nowrap;
    color: var(--ca-text-primary);
  }

  /* ── Empty panel (virgin) ─────────────────────────────────────────────── */
  .ca-datatable__empty-panel {
    flex: 1;
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ca-radius-lg);
    border: 1px solid var(--ca-outline-subtle);
    background: var(--ca-surface-raised);
  }

  /* ── Filtered no-results ──────────────────────────────────────────────── */
  .ca-datatable__no-results {
    padding: 0;
    text-align: center;
  }

  .ca-datatable__no-results-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 24px;
  }

  .ca-datatable__no-results-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--ca-action-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ca-text-hint);
  }

  .ca-datatable__no-results-title {
    font-size: var(--ca-font-size-body1);
    font-weight: 600;
    color: var(--ca-text-primary);
    margin: 0;
  }

  .ca-datatable__no-results-sub {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    margin: 0;
  }

  .ca-datatable__clear {
    margin-top: 4px;
    height: 32px;
    padding: 0 14px;
    border: 1px solid var(--ca-outline-default);
    border-radius: var(--ca-radius-md);
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-datatable__clear:hover { background: var(--ca-action-hover); }
</style>

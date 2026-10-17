<script lang="ts" generics="TData extends RowData">
  import { useLocale, useT } from '../../i18n/state.svelte.js';
  import { tableMessages } from './table-messages.js';
  import type { Snippet } from 'svelte';
  import {
    FlexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type Updater,
    type RowData,
  } from '@tanstack/svelte-table';
  import { ChevronDown, GripVertical, SearchX } from '@lucide/svelte';
  import { useDnd } from '../../primitives/dnd.svelte.js';
  import type { DndDropEvent } from '../../primitives/dnd.js';
  import DndLayer from '../DragAndDrop/DndLayer.svelte';
  import { caTableFeatures, createCaTable, type DataTableReorderEvent } from './table-hook.svelte.js';
  import DataTableColumnResize from './DataTableColumnResize.svelte';
  import DataTableToolbar from './DataTableToolbar.svelte';
  import DataTablePagination from './DataTablePagination.svelte';
  const t = useT();
  const locale = useLocale();
  const tm = $derived(tableMessages(locale()));


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
    /** Clicks on a link, button, input or other control inside a cell never reach this. */
    onRowClick?:           (row: TData) => void;
    /** Stable id of a row (default: its index). Needed for `onReorder`. */
    rowId?:                (row: TData) => string;
    /** Rows with the same key share a `<tbody>` with a collapsible header, in first-appearance order. */
    groupBy?:              (row: TData) => string;
    /** Custom group header content. */
    groupLabel?:           Snippet<[{ group: string; count: number }]>;
    /** Shows a drag grip on every row and reports the move; apply it to `data` yourself. */
    onReorder?:            (e: DataTableReorderEvent) => void;
    /** Rows per page in simple mode (default 10). */
    pageSize?:             number;
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
    rowId,
    groupBy,
    groupLabel,
    onReorder,
    pageSize = 10,
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
  // svelte-ignore state_referenced_locally
  let _pagination = $state<PaginationState>({ pageIndex: 0, pageSize });
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
    getRowId: (row: TData, index: number) => (rowId ? rowId(row) : String(index)),
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

  // ── Row groups ────────────────────────────────────────────────────────────
  // A `<tbody>` per group, in first-appearance order. Without `groupBy` there is one unnamed body.
  type Row_ = (typeof rows)[number];
  const sections = $derived.by(() => {
    if (!groupBy) return [{ key: undefined as string | undefined, rows: rows as Row_[] }];
    const map = new Map<string, Row_[]>();
    for (const row of rows) {
      const k = groupBy(row.original);
      const list = map.get(k);
      if (list) list.push(row);
      else map.set(k, [row]);
    }
    return Array.from(map, ([key, list]) => ({ key: key as string | undefined, rows: list }));
  });
  let collapsed = $state<Record<string, boolean>>({});
  const colCount = $derived(columns.length + (onReorder ? 1 : 0));
  // A fixed layout is exactly as wide as its columns; `width: 100%` would stretch them past their size.
  const tableWidth = $derived(
    table.getVisibleLeafColumns().reduce((sum, c) => sum + c.getSize(), 0) + (onReorder ? 44 : 0)
  );
  const resizable = $derived(table.getAllLeafColumns().some((c) => c.columnDef.meta?.resizable));

  // ── Row reorder ───────────────────────────────────────────────────────────
  const dnd = useDnd();
  const labelOf = (id: string) => {
    const row = rows.find((r) => r.id === id);
    const first = row?.getVisibleCells()[0];
    return String(first?.getValue() ?? id);
  };
  function drop(e: DndDropEvent) {
    onReorder?.({
      id: e.id,
      from: { group: groupBy ? e.from.container : undefined, index: e.from.index },
      to: { group: groupBy ? e.to.container : undefined, index: e.to.index },
    });
  }

  /** Clicks that belong to a control inside the cell are not row clicks. */
  const CONTROL = 'a, button, input, select, textarea, label, summary, [role=button], [role=menuitem], [role=checkbox], [role=switch], [contenteditable=true], [data-no-row-click]';
  function rowClick(e: MouseEvent, row: TData) {
    const target = e.target as Element | null;
    const control = target?.closest(CONTROL);
    if (control && e.currentTarget instanceof Element && e.currentTarget.contains(control)) return;
    onRowClick?.(row);
  }
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
        {#if onReorder}<DndLayer {dnd} />{/if}
        <table
          class="ca-datatable__table"
          class:ca-datatable__table--fixed={resizable}
          style:--ca-datatable-w={resizable ? `${tableWidth}px` : undefined}
        >
          {#if resizable}
            <colgroup>
              {#if onReorder}<col class="ca-datatable__grip-col" />{/if}
              {#each table.getVisibleLeafColumns() as column (column.id)}
                <col style:--ca-col-w="{column.getSize()}px" />
              {/each}
            </colgroup>
          {/if}
          <thead class="ca-datatable__thead">
            {#each headerGroups as hg (hg.id)}
              <tr>
                {#if onReorder}<th class="ca-datatable__grip-cell" scope="col"><span class="ca-sr-only">{tm.reorder}</span></th>{/if}
                {#each hg.headers as header (header.id)}
                  <th
                    scope="col"
                    class:ca-datatable__th--resizable={header.column.columnDef.meta?.resizable}
                    aria-sort={header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : undefined}
                  >
                    {#if !header.isPlaceholder}
                      <FlexRender {header} />
                    {/if}
                    {#if header.column.columnDef.meta?.resizable}
                      <DataTableColumnResize
                        column={header.column}
                        label={tm.resize(String(header.column.columnDef.meta?.label ?? header.column.id))}
                      />
                    {/if}
                  </th>
                {/each}
              </tr>
            {/each}
          </thead>
          {#if isEmpty}
            <tbody class="ca-datatable__tbody">
              <tr>
                <td class="ca-datatable__no-results" colspan={colCount}>
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
            </tbody>
          {:else}
            {#each sections as section (section.key ?? '')}
              {@const group = section.key}
              {@const open = group === undefined || !collapsed[group]}
              <tbody
                class="ca-datatable__tbody"
                data-group={group}
                {@attach onReorder ? dnd.sortable(() => ({
                  id: group ?? '',
                  group: 'rows',
                  label: group ?? '',
                  getItems: () => section.rows.map((r) => r.id),
                  getLabel: labelOf,
                  handle: '.ca-datatable__grip',
                  onDrop: drop,
                })) : undefined}
              >
                {#if group !== undefined}
                  <tr class="ca-datatable__group-row">
                    <th scope="rowgroup" colspan={colCount} class="ca-datatable__group">
                      <button
                        type="button"
                        class="ca-datatable__group-toggle"
                        aria-expanded={open}
                        onclick={() => (collapsed = { ...collapsed, [group]: open })}
                      >
                        <ChevronDown size={14} aria-hidden="true" class="ca-datatable__group-chevron" />
                        {#if groupLabel}
                          {@render groupLabel({ group, count: section.rows.length })}
                        {:else}
                          <span>{group}</span>
                          <span class="ca-datatable__group-count">{section.rows.length}</span>
                        {/if}
                      </button>
                    </th>
                  </tr>
                {/if}
                {#if open}
                  {#each section.rows as row (row.id)}
                    <tr
                      data-row
                      data-dnd-item={onReorder ? row.id : undefined}
                      class:ca-datatable__row--clickable={!!onRowClick}
                      onclick={onRowClick ? (e) => rowClick(e, row.original) : undefined}
                    >
                      {#if onReorder}
                        <td class="ca-datatable__grip-cell">
                          <button
                            type="button"
                            class="ca-datatable__grip"
                            aria-label={tm.move(labelOf(row.id))}
                            aria-describedby={dnd.instructionsId}
                          >
                            <GripVertical size={16} aria-hidden="true" />
                          </button>
                        </td>
                      {/if}
                      {#each row.getVisibleCells() as cell (cell.id)}
                        <td><FlexRender {cell} /></td>
                      {/each}
                    </tr>
                  {/each}
                {/if}
              </tbody>
            {/each}
          {/if}
        </table>
      </div>
    </div>
  {/if}

  <DataTablePagination {table} total={resolvedTotal} />
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-datatable {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-3);
      min-height: 0;
      min-width: 0;
      flex: 1;
    }

    /* ── Surface container ────────────────────────────────────────────────── */
    .ca-datatable__glass {
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow: auto;
      border-radius: var(--ca-radius-lg);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
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
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-datatable__thead th {
      height: var(--ca-control-height);
      padding: 0 var(--ca-space-3);
      text-align: left;
      vertical-align: middle;
      white-space: nowrap;
    }

    .ca-datatable__tbody tr {
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-datatable__tbody tr:last-child { border-bottom: none; }
    .ca-datatable__tbody + .ca-datatable__tbody { border-top: var(--ca-border-width) solid var(--ca-outline-subtle); }

    /* Fixed layout once a column is resizable: widths come from <colgroup>. */
    .ca-datatable__table--fixed { table-layout: fixed; width: var(--ca-datatable-w); }
    .ca-datatable__table--fixed td { overflow: hidden; text-overflow: ellipsis; }
    .ca-datatable__thead th { position: relative; }
    .ca-datatable__grip-col { width: 44px; }
    .ca-datatable__table--fixed col:not(.ca-datatable__grip-col) { width: var(--ca-col-w); }

    .ca-datatable__tbody tr:hover { background: var(--ca-action-hover); }

    .ca-datatable__row--clickable { cursor: pointer; }

    /* ── Row groups ───────────────────────────────────────────────────────── */
    .ca-datatable__group-row { background: var(--ca-surface-sunken, var(--ca-action-hover)); }
    .ca-datatable__tbody .ca-datatable__group-row:hover { background: var(--ca-surface-sunken, var(--ca-action-hover)); }
    .ca-datatable__tbody th.ca-datatable__group {
      padding: 0;
      text-align: left;
      font-weight: var(--ca-font-weight-semibold);
      font-size: var(--ca-font-size-label);
      color: var(--ca-text-secondary);
    }
    .ca-datatable__group-toggle {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      width: 100%;
      min-height: var(--ca-touch-target);
      padding: 0 var(--ca-space-3);
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      text-align: left;
    }
    .ca-datatable__group-toggle:focus-visible { outline-offset: -2px; }
    .ca-datatable__group-toggle :global(.ca-datatable__group-chevron) {
      transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-datatable__group-toggle[aria-expanded='false'] :global(.ca-datatable__group-chevron) { transform: rotate(-90deg); }
    .ca-datatable__group-count { color: var(--ca-text-hint); font-variant-numeric: tabular-nums; }

    /* ── Row grip ─────────────────────────────────────────────────────────── */
    .ca-datatable__tbody td.ca-datatable__grip-cell,
    .ca-datatable__thead th.ca-datatable__grip-cell { width: var(--ca-touch-target); padding: 0; text-align: center; }
    .ca-datatable__grip {
      display: inline-grid;
      place-items: center;
      min-width: var(--ca-touch-target);
      min-height: var(--ca-touch-target);
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--ca-text-secondary);
      cursor: grab;
      touch-action: none;
      border-radius: var(--ca-radius-sm);
    }
    .ca-datatable__grip:hover { background: var(--ca-action-hover); }

    .ca-datatable__tbody td {
      padding: var(--ca-space-2-5) var(--ca-space-3);
      vertical-align: middle;
      white-space: nowrap;
      color: var(--ca-text-primary);
    }

    /* ── Empty panel (virgin) ─────────────────────────────────────────────── */
    .ca-datatable__empty-panel {
      flex: 1;
      min-height: calc(var(--ca-space-24) * 3 - var(--ca-space-2));
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ca-radius-lg);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
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
      gap: var(--ca-space-2);
      padding: var(--ca-space-12) var(--ca-space-6);
    }

    .ca-datatable__no-results-icon {
      width: var(--ca-control-height-lg);
      height: var(--ca-control-height-lg);
      border-radius: 50%;
      background: var(--ca-action-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ca-text-hint);
    }

    .ca-datatable__no-results-title {
      font-size: var(--ca-font-size-body1);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0;
    }

    .ca-datatable__no-results-sub {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
    }

    .ca-datatable__clear {
      margin-top: var(--ca-space-1);
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-control-px);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-control);
      background: transparent;
      cursor: pointer;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-datatable__clear:hover { background: var(--ca-action-hover); }
}
</style>

<script lang="ts" generics="TData extends RowData">
  import { useT } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { Search, Download, Loader } from '@lucide/svelte';
  import type { CaTable } from './table-hook.svelte.js';
  import type { RowData } from '@tanstack/svelte-table';
  import DataTableColumnToggle from './DataTableColumnToggle.svelte';
  const t = useT();

  interface Props {
    table:                CaTable<TData>;
    total:                number;
    globalFilter:         string;
    onGlobalFilterChange: (v: string) => void;
    searchPlaceholder?:   string;
    isLoading?:           boolean;
    isExporting?:         boolean;
    onExport?:            () => void;
    children?:            Snippet; // filter chips (DataTableFacetedFilter)
  }

  let {
    table,
    total,
    globalFilter,
    onGlobalFilterChange,
    searchPlaceholder,
    isLoading,
    isExporting,
    onExport,
    children,
  }: Props = $props();
</script>

<div class="ca-dt-toolbar">
  <!-- Left: search + filter slots -->
  <div class="ca-dt-toolbar__left">
    <div class="ca-dt-toolbar__search">
      <Search size={14} class="ca-dt-toolbar__search-icon" />
      <input
        class="ca-dt-toolbar__input"
        type="search"
        placeholder={searchPlaceholder ?? t().dataTable.searchPlaceholder}
        value={globalFilter}
        oninput={(e) => onGlobalFilterChange((e.target as HTMLInputElement).value)}
        aria-label={searchPlaceholder ?? t().dataTable.searchPlaceholder}
      />
    </div>
    {@render children?.()}
  </div>

  <!-- Right: count + loading + export + column toggle -->
  <div class="ca-dt-toolbar__right">
    {#if isLoading}
      <Loader size={14} class="ca-dt-toolbar__spinner" />
    {/if}
    <span class="ca-dt-toolbar__count" aria-live="polite">
      {total.toLocaleString()} result{total === 1 ? '' : 's'}
    </span>
    {#if onExport}
      <button
        class="ca-dt-toolbar__export"
        onclick={onExport}
        disabled={isExporting || total === 0}
        type="button"
        title={t().dataTable.export}
      >
        {#if isExporting}
          <Loader size={14} class="ca-dt-toolbar__spinner" />
        {:else}
          <Download size={14} />
        {/if}
        {t().dataTable.exportShort}
      </button>
    {/if}
    <DataTableColumnToggle {table} />
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-dt-toolbar {
      container-type: inline-size;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-2);
      flex-shrink: 0;
    }

    .ca-dt-toolbar__left {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1-5);
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }

    .ca-dt-toolbar__search {
      position: relative;
      display: flex;
      align-items: center;
    }

    :global(.ca-dt-toolbar__search-icon) {
      position: absolute;
      left: var(--ca-space-2-5);
      pointer-events: none;
      color: var(--ca-text-hint);
    }

    .ca-dt-toolbar__input {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-2-5) 0 var(--ca-space-7);
      width: calc(var(--ca-space-24) * 2 + var(--ca-space-2));
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-control);
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      font-size: var(--ca-input-font-size);
      font-family: var(--ca-font-sans);
      outline: none;
      transition: border-color var(--ca-duration-fast) var(--ca-ease-standard),
                  background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-dt-toolbar__input::placeholder {
      color: var(--ca-text-hint);
    }

    .ca-dt-toolbar__input:focus {
      border-color: var(--ca-focus-ring);
      background: var(--ca-surface-overlay);
    }

    .ca-dt-toolbar__input::-webkit-search-cancel-button {
      -webkit-appearance: none;
      appearance: none;
    }

    .ca-dt-toolbar__right {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1-5);
      flex-shrink: 0;
    }

    :global(.ca-dt-toolbar__spinner) {
      color: var(--ca-text-hint);
      animation: ca-spin var(--ca-duration-spin) linear infinite;
    }

    @keyframes ca-spin {
      to { transform: rotate(360deg); }
    }

    .ca-dt-toolbar__count {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .ca-dt-toolbar__export {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1-5);
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-2-5);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-control);
      background: transparent;
      cursor: pointer;
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-secondary);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-dt-toolbar__export:hover:not(:disabled) {
      background: var(--ca-action-hover);
    }

    .ca-dt-toolbar__export:disabled {
      color: var(--ca-text-disabled);
      cursor: default;
    }

    /* Narrow slot: the search field takes the full row, actions wrap below it. */
    @container (max-width: 599.98px) {
      .ca-dt-toolbar__left,
      .ca-dt-toolbar__search,
      .ca-dt-toolbar__input { width: 100%; }
    }
}
</style>

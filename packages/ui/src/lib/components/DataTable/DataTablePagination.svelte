<script lang="ts" generics="TData extends RowData">
  import { useT } from '../../i18n/state.svelte.js';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { CaTable } from './table-hook.svelte.js';
  import type { RowData } from '@tanstack/svelte-table';
  const t = useT();

  interface Props {
    table: CaTable<TData>;
    total: number;
  }

  let { table, total }: Props = $props();

  const pagination  = $derived(table.atoms.pagination.get());
  const pageCount   = $derived(table.getPageCount());
  const canPrev     = $derived(table.getCanPreviousPage());
  const canNext     = $derived(table.getCanNextPage());

  const PAGE_SIZES = [
    { value: '10',  label: '10'  },
    { value: '20',  label: '20'  },
    { value: '50',  label: '50'  },
    { value: '100', label: '100' },
  ];
</script>

<div class="ca-dt-pagination">
  <!-- Page size -->
  <div class="ca-dt-pagination__size">
    <span class="ca-dt-pagination__label">{t().dataTable.rows}</span>
    <select
      class="ca-dt-pagination__select"
      aria-label={t().dataTable.rowsPerPage}
      value={String(pagination.pageSize)}
      onchange={(e) => table.setPageSize(Number((e.target as HTMLSelectElement).value))}
    >
      {#each PAGE_SIZES as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>

  <!-- Count + prev/next -->
  <div class="ca-dt-pagination__nav">
    <span class="ca-dt-pagination__count">
      {pagination.pageIndex + 1} / {pageCount || 1}
      &middot;
      {total.toLocaleString()}
    </span>
    <button
      class="ca-dt-pagination__btn"
      disabled={!canPrev}
      onclick={() => table.previousPage()}
      title={t().dataTable.previousPage}
      type="button"
      aria-label={t().dataTable.previousPage}
    >
      <ChevronLeft size={14} stroke-width={2} />
    </button>
    <button
      class="ca-dt-pagination__btn"
      disabled={!canNext}
      onclick={() => table.nextPage()}
      title={t().dataTable.nextPage}
      type="button"
      aria-label={t().dataTable.nextPage}
    >
      <ChevronRight size={14} stroke-width={2} />
    </button>
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-dt-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .ca-dt-pagination__size {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1-5);
    }

    .ca-dt-pagination__label {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }

    .ca-dt-pagination__select {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-1-5);
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-sm);
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-caption);
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      width: calc(var(--ca-space-12) + var(--ca-space-2));
    }

    .ca-dt-pagination__nav {
      display: flex;
      align-items: center;
      gap: var(--ca-space-1-5);
    }

    .ca-dt-pagination__count {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      font-variant-numeric: tabular-nums;
    }

    .ca-dt-pagination__btn {
      width: var(--ca-space-7);
      height: var(--ca-space-7);
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--ca-border-width) solid var(--ca-outline-default);
      border-radius: var(--ca-radius-sm);
      background: transparent;
      cursor: pointer;
      color: var(--ca-text-secondary);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-dt-pagination__btn:hover:not(:disabled) {
      background: var(--ca-action-hover);
    }

    .ca-dt-pagination__btn:disabled {
      color: var(--ca-text-disabled);
      cursor: default;
    }

    /* iOS Safari zooms into focused fields under 16px: keep them at 16px on touch / small screens. */
    @media (pointer: coarse), (max-width: 899.98px) {
      .ca-dt-pagination__select {
        font-size: max(16px, var(--ca-font-size-body2));
      }
    }
}
</style>

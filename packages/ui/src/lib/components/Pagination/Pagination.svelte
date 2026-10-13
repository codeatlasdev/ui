<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { Pagination as BitsPagination } from 'bits-ui';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';

  interface Props {
    count: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    onPageChange?: (page: number) => void;
    class?: string;
  }

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    onPageChange,
    class: className = '',
  }: Props = $props();
</script>

<BitsPagination.Root
  {count}
  {perPage}
  {siblingCount}
  bind:page
  onPageChange={onPageChange}
  class="ca-pagination {className}"
>
  {#snippet children({ pages, currentPage })}
    <BitsPagination.PrevButton class="ca-pagination__nav" aria-label={t().pagination.previous}>
      <ChevronLeft size={16} />
    </BitsPagination.PrevButton>

    {#each pages as p}
      {#if p.type === 'ellipsis'}
        <span class="ca-pagination__ellipsis" aria-hidden="true">…</span>
      {:else}
        <BitsPagination.Page page={p} class="ca-pagination__page" aria-current={p.value === currentPage ? 'page' : undefined}>
          {p.value}
        </BitsPagination.Page>
      {/if}
    {/each}

    <BitsPagination.NextButton class="ca-pagination__nav" aria-label={t().pagination.next}>
      <ChevronRight size={16} />
    </BitsPagination.NextButton>
  {/snippet}
</BitsPagination.Root>

<style>
  :global(.ca-pagination) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ca-space-1);
    max-width: 100%;
  }

  :global(.ca-pagination__nav),
  :global(.ca-pagination__page) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ca-control-height);
    height: var(--ca-control-height);
    border-radius: var(--ca-radius-control);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    background: var(--ca-glass-bg);
    -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
    backdrop-filter: var(--ca-blur-ultra-thin);
    cursor: pointer;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    transition:
      background var(--ca-duration-fast) var(--ca-ease-standard),
      border-color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-pagination__nav:hover),
  :global(.ca-pagination__page:hover) {
    background: var(--ca-action-hover);
    border-color: var(--ca-outline-default);
  }

  :global(.ca-pagination__page[aria-current="page"]) {
    background: var(--ca-brand-fill);
    border-color: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    font-weight: var(--ca-font-weight-semibold);
  }

  :global(.ca-pagination__nav[disabled]),
  :global(.ca-pagination__nav:disabled) {
    opacity: 0.4;
    pointer-events: none;
  }

  .ca-pagination__ellipsis {
    width: var(--ca-control-height);
    height: var(--ca-control-height);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-hint);
    user-select: none;
  }
</style>

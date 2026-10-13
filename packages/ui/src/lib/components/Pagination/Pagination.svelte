<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';

  interface Props {
    count: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    onPageChange?: (page: number) => void;
    class?: string;
  }

  type PageItem = { type: 'page'; value: number } | { type: 'ellipsis'; key: string };

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    onPageChange,
    class: className = '',
  }: Props = $props();

  const totalPages = $derived(count === 0 ? 1 : Math.ceil(count / perPage));

  // First and last page always show; the window around the current page grows near the edges
  // so the number of slots stays constant; gaps collapse to an ellipsis.
  const pages = $derived.by<PageItem[]>(() => {
    const show = new Set([1, totalPages]);
    const firstWithSiblings = 3 + siblingCount;
    const lastWithSiblings = totalPages - 2 - siblingCount;
    if (firstWithSiblings > lastWithSiblings) {
      for (let i = 2; i <= totalPages - 1; i++) show.add(i);
    } else if (page < firstWithSiblings) {
      for (let i = 2; i <= Math.min(firstWithSiblings, totalPages); i++) show.add(i);
    } else if (page > lastWithSiblings) {
      for (let i = totalPages - 1; i >= Math.max(lastWithSiblings, 2); i--) show.add(i);
    } else {
      for (let i = Math.max(page - siblingCount, 2); i <= Math.min(page + siblingCount, totalPages); i++) show.add(i);
    }
    const items: PageItem[] = [];
    let last = 0;
    for (const value of [...show].sort((a, b) => a - b)) {
      if (value - last > 1) items.push({ type: 'ellipsis', key: `ellipsis-${value}` });
      items.push({ type: 'page', value });
      last = value;
    }
    return items;
  });

  function go(next: number) {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped === page) return;
    page = clamped;
    onPageChange?.(clamped);
  }

  // Arrow keys, Home and End walk prev / pages / next, wrapping at the ends.
  function onkeydown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!(e.target instanceof HTMLElement) || !(e.currentTarget instanceof HTMLElement)) return;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (![next, prev, 'Home', 'End'].includes(e.key)) return;
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('.ca-pagination__nav, .ca-pagination__page')
    ).filter((el) => !el.disabled);
    const i = items.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const target =
      e.key === 'Home'
        ? items[0]
        : e.key === 'End'
          ? items[items.length - 1]
          : e.key === next
            ? items[(i + 1) % items.length]
            : items[(i - 1 + items.length) % items.length];
    e.preventDefault();
    target.focus();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Keydown only coordinates focus between the real <button> children. -->
<div class="ca-pagination {className}" data-orientation="horizontal" {onkeydown}>
  <button
    type="button"
    class="ca-pagination__nav"
    data-pagination-prev=""
    aria-label={t().pagination.previous}
    disabled={page <= 1}
    onclick={() => go(page - 1)}
  >
    <ChevronLeft size={16} />
  </button>

  {#each pages as p (p.type === 'page' ? p.value : p.key)}
    {#if p.type === 'ellipsis'}
      <span class="ca-pagination__ellipsis" aria-hidden="true">…</span>
    {:else}
      <button
        type="button"
        class="ca-pagination__page"
        data-pagination-page=""
        data-value={p.value}
        data-selected={p.value === page ? '' : undefined}
        aria-label="Page {p.value}"
        aria-current={p.value === page ? 'page' : undefined}
        onclick={() => go(p.value)}
      >
        {p.value}
      </button>
    {/if}
  {/each}

  <button
    type="button"
    class="ca-pagination__nav"
    data-pagination-next=""
    aria-label={t().pagination.next}
    disabled={page >= totalPages}
    onclick={() => go(page + 1)}
  >
    <ChevronRight size={16} />
  </button>
</div>

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

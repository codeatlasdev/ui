<script lang="ts">
  import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Current sort direction of this column. `none` renders the idle icon and no `aria-sort`. */
    sort?: 'none' | 'asc' | 'desc';
    /** Called when the header button is pressed; the caller owns the sort state and the next direction. */
    onsort?: () => void;
    /** Column label. */
    children?: Snippet;
    /** `false` draws no arrow while the column is unsorted: only the sorted column shows one (a quiet, mostly-read table). @default true */
    idleIcon?: boolean;
    /** `end` aligns the label (and its arrow) at the end of the cell, for numeric columns. @default 'start' */
    align?: 'start' | 'end';
    class?: string;
  }
  let { sort = 'none', onsort, children, idleIcon = true, align = 'start', class: className = '' }: Props = $props();
</script>

<th
  scope="col"
  class="{align === 'end' ? 'ca-table-sort-th--end' : ''} {className}"
  aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined}
>
  <button type="button" class="ca-table-sort" onclick={() => onsort?.()}>
    {@render children?.()}
    {#if sort === 'asc'}
      <ArrowUp size={12} stroke-width={2.5} class="ca-table-sort__icon" aria-hidden="true" />
    {:else if sort === 'desc'}
      <ArrowDown size={12} stroke-width={2.5} class="ca-table-sort__icon" aria-hidden="true" />
    {:else if idleIcon}
      <ArrowUpDown size={12} stroke-width={1.8} class="ca-table-sort__icon" aria-hidden="true" />
    {/if}
  </button>
</th>

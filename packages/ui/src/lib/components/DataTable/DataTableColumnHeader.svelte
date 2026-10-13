<script lang="ts" generics="TData extends RowData, TValue = unknown">
  import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/svelte';
  import type { CaColumn } from './table-hook.svelte.js';
  import type { RowData } from '@tanstack/svelte-table';

  interface Props {
    column: CaColumn<TData, TValue>;
    title: string;
    class?: string;
  }

  let { column, title, class: className = '' }: Props = $props();

  const sorted = $derived(column.getIsSorted());

  function toggle() {
    column.toggleSorting(sorted === 'asc');
  }
</script>

{#if !column.getCanSort()}
  <span class={className}>{title}</span>
{:else}
  <button class="ca-col-header {className}" onclick={toggle} type="button">
    {title}
    {#if sorted === 'asc'}
      <ArrowUp size={12} stroke-width={2.5} />
    {:else if sorted === 'desc'}
      <ArrowDown size={12} stroke-width={2.5} />
    {:else}
      <ArrowUpDown size={12} stroke-width={1.8} class="ca-col-header__idle" />
    {/if}
  </button>
{/if}

<style>
  .ca-col-header {
    display: inline-flex;
    align-items: center;
    gap: var(--ca-space-1);
    height: var(--ca-space-7);
    padding: 0 var(--ca-space-1-5);
    margin-left: calc(-1 * var(--ca-space-1-5));
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--ca-overline-tracking);
    border-radius: var(--ca-radius-sm);
    transition: background var(--ca-duration-fast) var(--ca-ease-standard),
                color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-col-header:hover {
    background: var(--ca-action-hover);
    color: var(--ca-text-secondary);
  }

  :global(.ca-col-header__idle) {
    opacity: 0.4;
  }
</style>

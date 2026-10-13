<script lang="ts" generics="TData extends RowData">
  import { t } from '../../i18n/state.svelte.js';
  import { DropdownMenu } from 'bits-ui';
  import { SlidersHorizontal, Check } from '@lucide/svelte';
  import type { CaTable } from './table-hook.svelte.js';
  import type { RowData } from '@tanstack/svelte-table';

  interface Props {
    table: CaTable<TData>;
  }

  let { table }: Props = $props();

  const hideable = $derived(
    table.getAllColumns().filter(col => col.getCanHide())
  );
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="ca-col-toggle__trigger">
    <SlidersHorizontal size={14} stroke-width={2} />
    {t().dataTable.columns}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="ca-col-toggle__content" sideOffset={6} align="end">
      {#each hideable as col (col.id)}
        <DropdownMenu.CheckboxItem
          class="ca-col-toggle__item"
          checked={col.getIsVisible()}
          onCheckedChange={(v) => col.toggleVisibility(v)}
        >
          <span class="ca-col-toggle__check" aria-hidden="true">
            {#if col.getIsVisible()}<Check size={12} stroke-width={3} />{/if}
          </span>
          {col.columnDef.meta?.label ?? col.id}
        </DropdownMenu.CheckboxItem>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
  :global(.ca-col-toggle__trigger) {
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
    transition: background var(--ca-duration-fast) var(--ca-ease-standard),
                border-color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-col-toggle__trigger:hover) {
    background: var(--ca-action-hover);
    border-color: var(--ca-outline-strong);
  }

  :global(.ca-col-toggle__content) {
    min-width: calc(var(--ca-space-20) * 2);
    padding: var(--ca-space-1);
    border-radius: var(--ca-radius-lg);
    border: var(--ca-border-width) solid var(--ca-overlay-border);
    background-color: var(--ca-overlay-bg);
    -webkit-backdrop-filter: var(--ca-overlay-blur);
    backdrop-filter: var(--ca-overlay-blur);
    box-shadow: var(--ca-shadow-lg);
    z-index: var(--ca-z-dropdown);
  }

  :global(.ca-col-toggle__item) {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2);
    width: 100%;
    padding: var(--ca-space-1-5) var(--ca-space-2-5);
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    border-radius: var(--ca-radius-sm);
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    text-align: left;
  }

  :global(.ca-col-toggle__item:hover) {
    background: var(--ca-action-hover);
  }

  :global(.ca-col-toggle__check) {
    width: var(--ca-space-3-5);
    height: var(--ca-space-3-5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ca-brand-text);
    flex-shrink: 0;
  }
</style>

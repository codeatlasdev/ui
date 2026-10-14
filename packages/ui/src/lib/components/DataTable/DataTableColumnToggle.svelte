<script lang="ts" generics="TData extends RowData">
  import { useT } from '../../i18n/state.svelte.js';
  import { createListbox } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { createTriggerProps } from '../Popover/trigger.js';
  import { SlidersHorizontal, Check } from '@lucide/svelte';
  import type { CaTable } from './table-hook.svelte.js';
  import type { RowData } from '@tanstack/svelte-table';
  const t = useT();

  interface Props {
    table: CaTable<TData>;
  }

  let { table }: Props = $props();

  const hideable = $derived(
    table.getAllColumns().filter(col => col.getCanHide())
  );

  const id = uid('coltoggle');
  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let menu = $state<HTMLElement | null>(null);

  const listbox = createListbox({
    mode: 'roving',
    items: () =>
      Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]') ?? []).map((el, i) => ({
        id: `${id}-item-${i}`,
        el: () => el,
        text: el.textContent ?? '',
      })),
    // Space/Enter toggle the column and keep the menu open, like a checkbox group.
    onSelect: (item) => item.el()?.click(),
  });

  let pendingFocus: 'first' | 'last' | 'container' = 'container';

  function close(restoreFocus = true) {
    open = false;
    listbox.clear();
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }

  const makeTrigger = createTriggerProps((el) => (anchor = el));
  const triggerAttrs = $derived(
    makeTrigger({
      id: `${id}-trigger`,
      popup: 'menu',
      open,
      controls: `${id}-menu`,
      onToggle: () => {
        if (open) return close();
        pendingFocus = 'container';
        open = true;
      },
      onKeydown: (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (open) return;
          pendingFocus = e.key === 'ArrowUp' ? 'last' : 'first';
          open = true;
        }
      },
    })
  );

  function onMounted(el: HTMLElement) {
    const frame = requestAnimationFrame(() => {
      if (pendingFocus === 'first') listbox.first();
      else if (pendingFocus === 'last') listbox.last();
      else el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') return close();
    const active = listbox.items.findIndex((it) => it.el() === document.activeElement);
    if (active >= 0 && active !== listbox.highlightedIndex) listbox.highlightedIndex = active;
    listbox.onkeydown(e);
  }
</script>

<button type="button" class="ca-col-toggle__trigger" {...triggerAttrs}>
  <SlidersHorizontal size={14} stroke-width={2} />
  {t().dataTable.columns}
</button>

<FloatingLayer
  {anchor}
  {open}
  side="bottom"
  align="end"
  sideOffset={6}
  bind:ref={menu}
  id="{id}-menu"
  role="menu"
  aria-labelledby="{id}-trigger"
  aria-orientation="vertical"
  tabindex={-1}
  class="ca-col-toggle__content"
  onDismiss={(reason) => close(reason === 'escape')}
  {onkeydown}
  {onMounted}
>
  {#each hideable as col (col.id)}
    {@const visible = col.getIsVisible()}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      role="menuitemcheckbox"
      tabindex="-1"
      class="ca-col-toggle__item"
      aria-checked={visible}
      data-state={visible ? 'checked' : 'unchecked'}
      onclick={() => col.toggleVisibility(!visible)}
      onpointermove={(e) => e.currentTarget.focus({ preventScroll: true })}
    >
      <span class="ca-col-toggle__check" aria-hidden="true">
        {#if visible}<Check size={12} stroke-width={3} />{/if}
      </span>
      {col.columnDef.meta?.label ?? col.id}
    </div>
  {/each}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
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
      outline: none;
    }

    :global(.ca-col-toggle__item:hover),
    :global(.ca-col-toggle__item:focus) {
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
}
</style>

<script lang="ts" generics="TData extends RowData, TValue = unknown">
  import type { RowData } from '@tanstack/svelte-table';
  import { announce } from '../../utils/announce.js';
  import type { CaColumn } from './table-hook.svelte.js';

  interface Props {
    column: CaColumn<TData, TValue>;
    /** Accessible name, e.g. "Resize Title". */
    label: string;
    /** Keyboard step in px (Shift uses 4x). */
    step?: number;
  }

  let { column, label, step = 10 }: Props = $props();

  const size = $derived(column.getSize());
  const min = $derived(column.columnDef.minSize ?? 40);
  const max = $derived(column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER);
  const initial = $derived(column.columnDef.size ?? 150);
  let dragging = $state(false);

  function clamp(n: number) {
    return Math.min(Number.isFinite(max) ? max : n, Math.max(min, Math.round(n)));
  }

  function set(n: number) {
    const next = clamp(n);
    if (next === column.getSize()) return;
    column.table.setColumnSizing((old) => ({ ...old, [column.id]: next }));
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const delta = e.shiftKey ? step * 4 : step;
    const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl';
    if (e.key === 'ArrowRight') set(size + (rtl ? -delta : delta));
    else if (e.key === 'ArrowLeft') set(size + (rtl ? delta : -delta));
    else if (e.key === 'Home') set(min);
    else if (e.key === 'End') set(Number.isFinite(max) ? max : size);
    else if (e.key === 'Enter' || e.key === 'Escape') set(initial);
    else return;
    e.preventDefault();
    announce(`${column.columnDef.meta?.label ?? column.id}: ${column.getSize()}px`);
  }

  function onpointerdown(e: PointerEvent) {
    if (e.button > 0 || !e.isPrimary) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startSize = column.getSize();
    const dir = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1;
    dragging = true;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      set(startSize + (ev.clientX - startX) * dir);
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      dragging = false;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  function ondblclick() {
    set(initial);
  }
</script>

<!-- A window splitter (WAI-ARIA APG): a focusable separator is interactive and its value is the column width in px. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="ca-datatable__resize"
  class:ca-datatable__resize--active={dragging}
  role="separator"
  aria-orientation="vertical"
  aria-label={label}
  aria-valuenow={size}
  aria-valuemin={min}
  aria-valuemax={Number.isFinite(max) && max < Number.MAX_SAFE_INTEGER ? max : undefined}
  tabindex="0"
  {onkeydown}
  {onpointerdown}
  {ondblclick}
></div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-datatable__resize {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: var(--ca-space-3);
      cursor: col-resize;
      touch-action: none;
      user-select: none;
      outline-offset: -2px;
    }

    .ca-datatable__resize::after {
      content: '';
      position: absolute;
      inset-block: var(--ca-space-2);
      inset-inline-end: 0;
      width: 2px;
      border-radius: var(--ca-radius-pill);
      background: var(--ca-outline-subtle);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-datatable__resize:hover::after,
    .ca-datatable__resize:focus-visible::after,
    .ca-datatable__resize--active::after {
      background: var(--ca-brand-fill);
    }

    @media (pointer: coarse) {
      .ca-datatable__resize { width: var(--ca-touch-target); }
    }

    @media (forced-colors: active) {
      .ca-datatable__resize::after { background: CanvasText; }
      .ca-datatable__resize:focus-visible::after,
      .ca-datatable__resize--active::after { background: Highlight; }
    }
}
</style>

<script lang="ts">
  import { getContext } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { resizablePanels } from '../../i18n/groups/resizablePanels.js';
  import { SPLITTER_KEY, type SplitterContext } from './splitter.js';
  const t = useMessages(resizablePanels);

  /**
   * The WAI-ARIA window splitter between two panels: `role="separator"`, focusable, valued as the
   * size (percent) of the panel before it. Arrows move 1%, Shift+arrows 10%, Home and End go to the
   * limits. Place it between two `ResizablePanel`s.
   */
  interface Props {
    /** Accessible name; name what it resizes ("Resize sidebar"). */
    label?: string;
    class?: string;
  }

  let { label, class: className = '' }: Props = $props();

  const ctx = getContext<SplitterContext>(SPLITTER_KEY);
  let el = $state<HTMLElement>();
  let index = $state(-1);
  let active = $state(false);
  let startPos = 0;
  let startSize = 0;

  // The handle's position among the group's handles, once it is in the DOM.
  $effect(() => {
    void ctx.value(0);
    if (el) index = ctx.handleIndex(el);
  });

  const horizontal = $derived(ctx.direction === 'horizontal');
  const bounds = $derived(index < 0 ? { min: 0, max: 100 } : ctx.bounds(index));
  const now = $derived(index < 0 ? 0 : ctx.value(index));
  const pos = (e: PointerEvent) => (horizontal ? e.clientX : e.clientY);

  function down(e: PointerEvent) {
    if (e.button !== 0 || index < 0) return;
    e.preventDefault();
    try {
      el?.setPointerCapture(e.pointerId);
    } catch {
      /* no live pointer to capture (a synthetic event): the drag still tracks */
    }
    startPos = pos(e);
    startSize = ctx.value(index);
    active = true;
  }
  function move(e: PointerEvent) {
    if (!active) return;
    const extent = ctx.extent();
    if (extent <= 0) return;
    ctx.resizeTo(index, startSize + ((pos(e) - startPos) / extent) * 100, false);
  }
  function up(e: PointerEvent) {
    if (!active) return;
    active = false;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    ctx.commit();
  }
  function cancel() {
    if (!active) return;
    active = false;
    ctx.resizeTo(index, startSize, false);
  }

  function key(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey || index < 0) return;
    const step = e.shiftKey ? 10 : 1;
    const rtl = horizontal && el ? getComputedStyle(el).direction === 'rtl' : false;
    const inc = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const dec = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    let next: number;
    if (e.key === inc) next = now + step;
    else if (e.key === dec) next = now - step;
    else if (e.key === 'Home') next = bounds.min;
    else if (e.key === 'End') next = bounds.max;
    else return;
    e.preventDefault();
    ctx.resizeTo(index, next, true);
  }
</script>

<!-- A window splitter (WAI-ARIA APG): a focusable separator is interactive; its value is the size of the panel before it. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={el}
  role="separator"
  tabindex="0"
  aria-orientation={horizontal ? 'vertical' : 'horizontal'}
  aria-label={label ?? t().resizablePanels.resize}
  aria-valuenow={Math.round(now)}
  aria-valuemin={Math.ceil(bounds.min)}
  aria-valuemax={Math.floor(bounds.max)}
  aria-controls={index < 0 ? undefined : ctx.panelDomId(index)}
  class="ca-resizable__handle {className}"
  data-direction={ctx.direction}
  data-active={active ? '' : undefined}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={cancel}
  onkeydown={key}
></div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* A 1px line with an 8px grab area (the ::before), so the visible rule stays thin. */
    .ca-resizable__handle {
      position: relative;
      flex: none;
      background: var(--ca-outline-subtle);
      touch-action: none;
    }
    .ca-resizable__handle[data-direction='horizontal'] { width: var(--ca-border-width); cursor: col-resize; }
    .ca-resizable__handle[data-direction='vertical'] { height: var(--ca-border-width); cursor: row-resize; }
    .ca-resizable__handle::before {
      content: '';
      position: absolute;
      inset: 0;
    }
    .ca-resizable__handle[data-direction='horizontal']::before { inset-inline: calc(var(--ca-space-1) * -1); }
    .ca-resizable__handle[data-direction='vertical']::before { inset-block: calc(var(--ca-space-1) * -1); }
    .ca-resizable__handle:hover,
    .ca-resizable__handle[data-active] { background: var(--ca-brand-fill); }
    .ca-resizable__handle:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
      background: var(--ca-brand-fill);
    }
    @media (forced-colors: active) {
      .ca-resizable__handle { background: CanvasText; forced-color-adjust: none; }
      .ca-resizable__handle:hover,
      .ca-resizable__handle[data-active],
      .ca-resizable__handle:focus-visible { background: Highlight; }
    }
}
</style>

<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { appShell } from '../../i18n/groups/appShell.js';
  import { PANEL_MAX_WIDTH, PANEL_MIN_WIDTH, clampPanelWidth } from './types.js';
  const t = useMessages(appShell);

  interface Props {
    /** Current panel width in px. */
    width:    number;
    /** Called with the new (already clamped) width on every drag move or key press. */
    onResize: (width: number) => void;
    /** Called once when a drag or a key press settles, to persist the width. */
    onCommit?: (width: number) => void;
    /** Called when a drag starts and ends, so the layout can drop the spring while the pointer holds the edge. */
    onDragChange?: (dragging: boolean) => void;
  }

  let { width, onResize, onCommit, onDragChange }: Props = $props();

  const STEP = 8;
  const BIG_STEP = 32;

  let startX = 0;
  let startW = 0;
  let dragging = $state(false);

  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startX = e.clientX;
    startW = width;
    dragging = true;
    onDragChange?.(true);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    onResize(clampPanelWidth(startW + e.clientX - startX));
  }
  function up(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    onDragChange?.(false);
    onCommit?.(clampPanelWidth(startW + e.clientX - startX));
  }
  function cancel() {
    if (!dragging) return;
    dragging = false;
    onDragChange?.(false);
    onResize(startW);
  }

  function key(e: KeyboardEvent) {
    const step = e.shiftKey ? BIG_STEP : STEP;
    let next: number;
    if (e.key === 'ArrowRight') next = width + step;
    else if (e.key === 'ArrowLeft') next = width - step;
    else if (e.key === 'Home') next = PANEL_MIN_WIDTH;
    else if (e.key === 'End') next = PANEL_MAX_WIDTH;
    else return;
    e.preventDefault();
    next = clampPanelWidth(next);
    onResize(next);
    onCommit?.(next);
  }
</script>

<!-- A window splitter (WAI-ARIA APG): a focusable separator is interactive and its value is the panel width in px. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="ca-panel__resize"
  class:ca-panel__resize--active={dragging}
  role="separator"
  aria-orientation="vertical"
  aria-label={t().appShell.resizePanel}
  aria-valuenow={width}
  aria-valuemin={PANEL_MIN_WIDTH}
  aria-valuemax={PANEL_MAX_WIDTH}
  tabindex="0"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={cancel}
  onkeydown={key}
></div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* An 8px grab strip on the panel's trailing edge, inside it (the panel clips); the visible line is the 2px ::after. */
    .ca-panel__resize {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: var(--ca-space-2);
      z-index: 1;
      cursor: col-resize;
      touch-action: none;
    }
    .ca-panel__resize::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: 2px;
      background: transparent;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-panel__resize:hover::after,
    .ca-panel__resize--active::after {
      background: var(--ca-brand-fill);
    }
    .ca-panel__resize:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }

    @media (forced-colors: active) {
      .ca-panel__resize:hover::after,
      .ca-panel__resize--active::after { background: Highlight; forced-color-adjust: none; }
    }
}
</style>

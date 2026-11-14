<script lang="ts">
  import { ArrowLeft } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { masterDetail } from '../../i18n/groups/masterDetail.js';
  import { keyboardAware } from '../../actions/keyboard-aware.js';
  import { openLayer, type LayerHandle } from '../../primitives/index.js';
  import IconButton from '../Button/IconButton.svelte';
  const t = useMessages(masterDetail);

  /**
   * MasterDetail: a list and the detail of the selected row (an inbox: conversations and the
   * thread). One component for every width, with no `responsive.width` branch.
   *
   * - Wide: the master (fixed `listWidth`) next to the detail; `empty` shows until a row is selected.
   * - Narrow: the master fills the container; the detail becomes a full-screen modal layer (the
   *   same registration as MobilePane: Escape and the back button close it, focus returns to the
   *   row, and with the overlay-history bridge the browser's Back closes it) while `selected` is set.
   *
   * The detail is ONE DOM node: the split is a container query, so the first paint is right (no
   * flash of the squeezed desktop layout) and a draft in the composer survives crossing the
   * breakpoint. The breakpoint is measured on the component's own width, so it works inside a
   * shell with a panel.
   *
   *   <MasterDetail bind:selected={id} detailTitle={name}>
   *     {#snippet master()}<ConversationList … />{/snippet}
   *     {#snippet detail()}<Thread … />{/snippet}
   *     {#snippet empty()}<EmptyState title="Select a conversation" />{/snippet}
   *   </MasterDetail>
   */
  interface Props {
    /** Id of the selected row, or `null`. Bindable: the back button and Escape set it to `null`. */
    selected?: string | null;
    /** Container width from which the two columns show: `sm` 600px, `md` 900px, `lg` 1200px. @default 'md' */
    breakpoint?: 'sm' | 'md' | 'lg';
    /** Width of the master column when wide. @default '22rem' */
    listWidth?: string;
    /** Header title and accessible name of the narrow pane. */
    detailTitle?: string;
    /** Called after the back button or Escape closes the narrow pane. */
    onback?: () => void;
    /** Wide only: a splitter between the columns (drag, or Left/Right arrow keys). */
    resizable?: boolean;
    /** Give the narrow pane a browser-history entry under the overlay-history bridge. @default true */
    history?: boolean;
    /** Accessible name of the master region. */
    masterLabel?: string;
    master: Snippet;
    detail: Snippet;
    /** Wide only: shown in the detail column while nothing is selected. */
    empty?: Snippet;
    class?: string;
  }

  let {
    selected = $bindable(null),
    breakpoint = 'md',
    listWidth = '22rem',
    detailTitle = '',
    onback,
    resizable = false,
    history = true,
    masterLabel,
    master,
    detail,
    empty,
    class: className = '',
  }: Props = $props();

  const MIN: Record<'sm' | 'md' | 'lg', number> = { sm: 600, md: 900, lg: 1200 };

  let root = $state<HTMLElement>();
  let pane = $state<HTMLDialogElement>();
  let width = $state(0);
  let dragWidth = $state<number>();
  const wide = $derived(width >= MIN[breakpoint]);
  const hasDetail = $derived(selected !== null && selected !== undefined);
  const modal = $derived(!wide && hasDetail);
  const splitId = $props.id();

  $effect(() => {
    if (!root) return;
    width = root.getBoundingClientRect().width;
    const ro = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
    });
    ro.observe(root);
    return () => ro.disconnect();
  });

  function close() {
    selected = null;
    onback?.();
  }

  // Narrow and a row selected: the pane is a modal layer on the shared stack. Otherwise it is a plain
  // (non-modal) dialog in the grid: wide shows it in place, narrow keeps it closed. Same node both ways.
  $effect(() => {
    const el = pane;
    if (!el) return;
    let layer: LayerHandle | undefined;
    if (modal) {
      if (el.open) el.close();
      layer = openLayer(el, {
        kind: 'modal',
        // The node is the grid's own: it must stay where it is declared (one mount, no move to <body>).
        inPlace: true,
        outside: false,
        initialFocus: 'container',
        history,
        onDismiss: close,
      });
    } else if (wide) {
      if (!el.open) el.show();
    } else if (el.open) el.close();
    return () => layer?.close();
  });

  function onSplitKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 48 : 16;
    const current = dragWidth ?? (root?.querySelector<HTMLElement>('.ca-md__master')?.getBoundingClientRect().width ?? 0);
    if (e.key === 'ArrowLeft') dragWidth = Math.max(160, current - step);
    else if (e.key === 'ArrowRight') dragWidth = Math.min(width - 240, current + step);
    else return;
    e.preventDefault();
  }

  function onSplitPointer(e: PointerEvent) {
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    const left = root?.getBoundingClientRect().left ?? 0;
    const move = (ev: PointerEvent) => {
      dragWidth = Math.min(Math.max(ev.clientX - left, 160), width - 240);
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  }
</script>

<div bind:this={root} class="ca-md {className}">
 <div
  class="ca-md__grid ca-md--{breakpoint}"
  class:ca-md--resizable={resizable}
  style={dragWidth !== undefined ? `--ca-md-list:${dragWidth}px` : `--ca-md-list:${listWidth}`}
 >
  <section class="ca-md__master" aria-label={masterLabel}>{@render master()}</section>

  {#if resizable}
    <!-- A window splitter: focusable separator, arrow keys and pointer drag (wide only). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      class="ca-md__split"
      role="separator"
      aria-orientation="vertical"
      aria-label={t().masterDetail.resize}
      aria-controls={splitId}
      tabindex="0"
      onkeydown={onSplitKey}
      onpointerdown={onSplitPointer}
    ></div>
  {/if}

  <!-- `dialog` is the only role an open <dialog> may take besides `alertdialog`; inline it is a non-modal one. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <dialog
    bind:this={pane}
    id={splitId}
    class="ca-md__detail"
    role="dialog"
    aria-modal={modal ? 'true' : 'false'}
    aria-label={detailTitle || undefined}
    data-state={modal ? 'modal' : 'inline'}
    use:keyboardAware
  >
    {#if modal}
      <header class="ca-md__header">
        <IconButton variant="ghost" aria-label={t().masterDetail.back} onclick={close}>
          <ArrowLeft size={22} aria-hidden="true" />
        </IconButton>
        <span class="ca-md__title">{detailTitle}</span>
      </header>
    {/if}
    <div class="ca-md__body">
      {#if hasDetail}{@render detail()}{:else if empty}{@render empty()}{/if}
    </div>
  </dialog>
 </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* The container is the outer node; the grid inside it answers its width. */
    .ca-md {
      container-type: inline-size;
      container-name: ca-md;
      height: 100%;
      min-height: 0;
    }

    .ca-md__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      height: 100%;
      min-height: 0;
      position: relative;
    }

    .ca-md__master {
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior-y: contain;
    }

    .ca-md__split { display: none; }

    /* The detail is a <dialog> so it can be promoted to a modal layer without remounting. Reset the UA box. */
    .ca-md__detail {
      position: static;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      width: auto;
      max-width: none;
      max-height: none;
      color: inherit;
      background: transparent;
      min-width: 0;
      min-height: 0;
      /* Narrow and not a modal layer: nothing to show beside the list. */
      display: none;
    }

    .ca-md__body {
      flex: 1;
      min-height: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overscroll-behavior-y: contain;
    }

    /* Narrow, row selected: the modal layer covers the viewport. */
    .ca-md__detail[data-state='modal'][open] {
      position: fixed;
      inset: 0;
      width: 100%;
      height: var(--ca-vh);
      display: flex;
      flex-direction: column;
      background: var(--ca-surface-base);
      outline: none;
      padding-bottom: var(--ca-safe-bottom);
      padding-left: var(--ca-safe-left);
      padding-right: var(--ca-safe-right);
    }

    .ca-md__header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      min-height: var(--ca-header-height);
      padding: var(--ca-safe-top) var(--ca-space-3) 0;
      box-shadow: inset 0 calc(-1 * var(--ca-border-width)) 0 var(--ca-outline-subtle);
    }

    .ca-md__title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ca-font-size-h6);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-primary);
    }

    /* Wide: two columns. The container query is the whole switch, so the first paint is right. */
    @container ca-md (min-width: 600px) {
      .ca-md--sm { grid-template-columns: var(--ca-md-list) minmax(0, 1fr); }
      .ca-md--sm .ca-md__detail:not([data-state='modal']) { display: flex; flex-direction: column; }
      .ca-md--sm.ca-md--resizable { grid-template-columns: var(--ca-md-list) 0 minmax(0, 1fr); }
      .ca-md--sm .ca-md__split { display: block; }
    }

    @container ca-md (min-width: 900px) {
      .ca-md--md { grid-template-columns: var(--ca-md-list) minmax(0, 1fr); }
      .ca-md--md .ca-md__detail:not([data-state='modal']) { display: flex; flex-direction: column; }
      .ca-md--md.ca-md--resizable { grid-template-columns: var(--ca-md-list) 0 minmax(0, 1fr); }
      .ca-md--md .ca-md__split { display: block; }
    }

    @container ca-md (min-width: 1200px) {
      .ca-md--lg { grid-template-columns: var(--ca-md-list) minmax(0, 1fr); }
      .ca-md--lg .ca-md__detail:not([data-state='modal']) { display: flex; flex-direction: column; }
      .ca-md--lg.ca-md--resizable { grid-template-columns: var(--ca-md-list) 0 minmax(0, 1fr); }
      .ca-md--lg .ca-md__split { display: block; }
    }

    .ca-md__split {
      position: relative;
      width: 0;
      cursor: col-resize;
      touch-action: none;
    }

    /* A 12px grab area centred on the 1px divider, so the hit area is generous but nothing shifts. */
    .ca-md__split::before {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline: -6px;
    }

    .ca-md__split::after {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: var(--ca-border-width);
      background: var(--ca-outline-subtle);
    }

    .ca-md__split:hover::after,
    .ca-md__split:focus-visible::after {
      width: 3px;
      inset-inline-start: -1px;
      background: var(--ca-focus-ring);
    }

    .ca-md__split:focus-visible { outline: none; }
}
</style>

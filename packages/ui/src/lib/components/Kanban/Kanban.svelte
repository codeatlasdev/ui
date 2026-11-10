<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface KanbanColumn<T> {
    id: string;
    label: string;
    /** Status colour of the header rail and the tab dot: any CSS colour or token (`var(--ca-info-main)`). */
    color?: string;
    /** Loaded cards, in display order. */
    items: T[];
    /** Server-side count, shown in the header and used by "Load more (N)". Default: `items.length`. */
    total?: number;
    /** More cards exist on the server: shows the "Load more (N)" fallback and fires `onloadmore` near the end. */
    hasMore?: boolean;
    /** First page loading: skeleton cards instead of the list. */
    loading?: boolean;
    /** A next page is loading: skeleton cards after the last card. */
    loadingMore?: boolean;
  }

  export interface KanbanMove<T> {
    card: T;
    from: { column: string; index: number };
    to: { column: string; index: number };
  }

  export interface KanbanCardState {
    dragging: boolean;
    /** Another card of the board is being dragged. */
    active: boolean;
  }
</script>

<script lang="ts" generics="T">
  import { EllipsisVertical } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { kanban } from '../../i18n/groups/kanban.js';
  import { rovingFocus } from '../../primitives/index.js';
  import { useDnd } from '../../primitives/dnd.svelte.js';
  import type { HeadingLevel } from '../../types.js';
  import { announce } from '../../utils/announce.js';
  import DndLayer from '../DragAndDrop/DndLayer.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
  import DropdownMenuLabel from '../DropdownMenu/DropdownMenuLabel.svelte';
  import { sectionHeadingLevel } from '../PageShell/heading-context.js';

  interface Props {
    columns: KanbanColumn<T>[];
    /** Stable id of a card. */
    getId: (card: T) => string;
    /** A card was moved (drag, keyboard or "Move to…"). Apply it to your data: `to.index` is always 0 with `drop="container"`. */
    onmove?: (move: KanbanMove<T>) => void;
    /** A column wants its next page (its list scrolled near the end, or "Load more" was pressed). */
    onloadmore?: (columnId: string) => void;
    /** Cards can be moved. `false` hides the menu and turns dragging off. Default true. */
    canMove?: boolean;
    /**
     * `container` (default): the column is the drop target, no insertion line, `to.index` is 0: right for
     * columns the server orders (newest first). `position`: the card lands between cards.
     */
    drop?: 'container' | 'position';
    /**
     * Force the mobile layout (one column at a time, tab strip). Default: automatic below the `sm`
     * breakpoint (600px) of the board's own width.
     */
    compact?: boolean;
    /** `card` (default): each column is a framed, tinted panel. `flat`: no column surface or border (the board draws only the cards). */
    variant?: 'card' | 'flat';
    /** `box` (default): the board draws the card's border and background. `none`: the `card` snippet owns its chrome. */
    cardChrome?: 'box' | 'none';
    /**
     * Link target of a card. With it the card body is an `<a href>` (Enter follows the link, Space lifts the
     * card) instead of `div[role=button]`, so a card that is a link has no nested interactive control.
     */
    cardHref?: (card: T) => string | undefined;
    /** Accessible name of the board. */
    label?: string;
    /**
     * Heading level of the column titles (2–6). Only the tag changes, never the look. Default 2
     * (inside a `PageShell` the page's section level), so a board under the page `<h1>` keeps the
     * heading order; pass 3 when the board sits under an `<h2>`. The mobile tab layout renders no
     * column headings.
     */
    headingLevel?: HeadingLevel;
    /** Distance from the end of a column list (px) at which `onloadmore` fires. Default 240. */
    nearEnd?: number;
    class?: string;
    /** Card content. The card wrapper, handle, drag state and "Move to…" button are the board's. */
    card: Snippet<[T, KanbanCardState]>;
    /** Shown in an empty column. */
    empty?: Snippet<[KanbanColumn<T>, { canMove: boolean }]>;
    /** Replaces the column title row (colour rail, title, count). */
    header?: Snippet<[KanbanColumn<T>]>;
    /**
     * Extra content for each column, rendered after the count (a money total, a weight, a progress
     * hint) while the colour rail, title and count stay. On the mobile tab layout it shows as a row
     * above the active column's cards. Ignored when `header` replaces the title row.
     */
    summary?: Snippet<[KanbanColumn<T>]>;
  }

  let {
    columns,
    getId,
    onmove,
    onloadmore,
    canMove = true,
    drop = 'container',
    compact,
    variant = 'card',
    cardChrome = 'box',
    cardHref,
    label,
    headingLevel,
    nearEnd = 240,
    class: className = '',
    card,
    empty,
    header,
    summary,
  }: Props = $props();

  const t = useMessages(kanban);
  const dnd = useDnd();
  const uid = $props.id();
  // Read once at init: context lookups are only valid during component initialisation.
  const inheritedLevel = sectionHeadingLevel(2);
  const level = $derived(headingLevel ?? inheritedLevel);

  let root = $state<HTMLElement>();
  let board = $state<HTMLElement>();
  let width = $state(1024);
  const mobile = $derived(compact ?? width < 600);
  let selected = $state<string>();
  const current = $derived(columns.find((c) => c.id === selected) ?? columns[0]);
  let fade = $state<'start' | 'end' | 'both' | undefined>();

  const total = (c: KanbanColumn<T>) => c.total ?? c.items.length;
  const byId = (id: string) => {
    for (const c of columns) {
      const i = c.items.findIndex((x) => getId(x) === id);
      if (i >= 0) return { column: c, index: i, card: c.items[i] };
    }
    return undefined;
  };
  const cardName = (id: string) => {
    const el = root?.querySelector(`[data-dnd-item="${CSS.escape(id)}"] .ca-kanban__body`);
    return (el?.textContent ?? id).trim().replace(/\s+/g, ' ') || id;
  };

  function commit(cardId: string, toColumn: string, toIndex: number) {
    const hit = byId(cardId);
    if (!hit) return;
    onmove?.({
      card: hit.card,
      from: { column: hit.column.id, index: hit.index },
      to: { column: toColumn, index: toIndex },
    });
  }

  function ondrop(e: { id: string; to: { container: string; index: number } }) {
    commit(e.id, e.to.container, drop === 'container' ? 0 : e.to.index);
  }

  function moveTo(cardId: string, column: KanbanColumn<T>) {
    const name = cardName(cardId);
    commit(cardId, column.id, 0);
    announce(t().kanban.moved(name, column.label));
  }

  // ── Board: measure width and edge fade ────────────────────────────────────
  function measureFade() {
    if (!board) return;
    const max = board.scrollWidth - board.clientWidth;
    const atStart = board.scrollLeft < 1;
    const atEnd = board.scrollLeft > max - 1;
    fade = max < 1 || mobile ? undefined : atStart ? 'end' : atEnd ? 'start' : 'both';
  }

  onMount(() => {
    if (!root || !board) return;
    width = root.clientWidth;
    const ro = new ResizeObserver(() => {
      width = root?.clientWidth ?? width;
      measureFade();
    });
    ro.observe(root);
    ro.observe(board);
    measureFade();
    return () => ro.disconnect();
  });
  $effect(() => {
    mobile;
    columns.length;
    queueMicrotask(measureFade);
  });

  // ── Board pan (mouse on the background) and wheel → sideways ──────────────
  function pan(node: HTMLElement) {
    let id = -1;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      // Only the empty background pans (the board itself, never a column, card or control).
      if (e.target !== node) return;
      id = e.pointerId;
      startX = e.clientX;
      startLeft = node.scrollLeft;
      node.setAttribute('data-panning', '');
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      node.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      node.removeAttribute('data-panning');
    };
    // A vertical wheel over the gaps scrolls the board sideways; trackpad deltaX and wheels over a
    // column list (which scrolls itself) stay native.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const inList = (e.target as Element).closest('.ca-kanban__list');
      if (inList && inList.scrollHeight > inList.clientHeight) return;
      if (node.scrollWidth <= node.clientWidth) return;
      e.preventDefault();
      node.scrollLeft += e.deltaY;
    };
    node.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      node.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      node.removeEventListener('wheel', onWheel);
    };
  }

  // ── Per-column infinite scroll ────────────────────────────────────────────
  function nearEndWatch(node: HTMLElement, getColumn: () => KanbanColumn<T>) {
    let asked = -1;
    const check = () => {
      const c = getColumn();
      if (!c.hasMore || c.loading || c.loadingMore) return;
      const left = node.scrollHeight - node.scrollTop - node.clientHeight;
      // One request per page: wait until the item count changes before asking again.
      if (left <= nearEnd && asked !== c.items.length) {
        asked = c.items.length;
        onloadmore?.(c.id);
      }
    };
    node.addEventListener('scroll', check, { passive: true });
    return () => node.removeEventListener('scroll', check);
  }

  function loadMore(c: KanbanColumn<T>) {
    onloadmore?.(c.id);
  }

  // ── Arrow navigation between cards (nothing lifted) ───────────────────────
  // Once a card is lifted the drag engine owns the arrows (they move the card); before that, Up and Down
  // move focus inside a column and Left and Right to the same index of the neighbouring column.
  function onBoardKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || dnd.active !== null || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const body = (e.target as Element).closest<HTMLElement>('.ca-kanban__body');
    if (!body || e.target !== body) return;
    const list = body.closest<HTMLElement>('.ca-kanban__list');
    const section = body.closest<HTMLElement>('[data-kanban-column]');
    if (!list || !section) return;
    const bodies = (l: Element) => [...l.querySelectorAll<HTMLElement>('.ca-kanban__body')];
    const mine = bodies(list);
    const at = mine.indexOf(body);
    let next: HTMLElement | undefined;
    if (e.key === 'ArrowDown') next = mine[at + 1];
    else if (e.key === 'ArrowUp') next = mine[at - 1];
    else {
      const sections = [...(root?.querySelectorAll<HTMLElement>('[data-kanban-column]:not([hidden])') ?? [])];
      let i = sections.indexOf(section) + (e.key === 'ArrowRight' ? 1 : -1);
      // Skip columns with no card to land on.
      while (i >= 0 && i < sections.length) {
        const cards = bodies(sections[i]);
        if (cards.length) {
          next = cards[Math.min(at, cards.length - 1)];
          break;
        }
        i += e.key === 'ArrowRight' ? 1 : -1;
      }
    }
    e.preventDefault();
    e.stopPropagation();
    next?.focus();
  }

  // ── Tab strip (mobile) ────────────────────────────────────────────────────
  function tabsRoving(node: HTMLElement) {
    return rovingFocus(node, { selector: '[role="tab"]', orientation: 'horizontal' });
  }
  function selectTab(id: string) {
    selected = id;
  }
</script>

<div
  bind:this={root}
  class="ca-kanban {className}"
  class:ca-kanban--mobile={mobile}
  class:ca-kanban--flat={variant === 'flat'}
  class:ca-kanban--bare={cardChrome === 'none'}
  role="region"
  aria-label={label ?? t().kanban.board}
  data-fade={fade}
>
  <DndLayer {dnd} />

  {#if mobile}
    <div class="ca-kanban__tabs" role="tablist" aria-label={t().kanban.stages} {@attach tabsRoving}>
      {#each columns as c (c.id)}
        <button
          type="button"
          role="tab"
          id="{uid}-tab-{c.id}"
          class="ca-kanban__tab"
          aria-selected={current?.id === c.id}
          aria-controls="{uid}-panel-{c.id}"
          tabindex={current?.id === c.id ? 0 : -1}
          onclick={() => selectTab(c.id)}
          onfocus={() => selectTab(c.id)}
        >
          <span class="ca-kanban__dot" style:--ca-kanban-color={c.color} aria-hidden="true"></span>
          <span class="ca-kanban__tab-label">{c.label}</span>
          <span class="ca-kanban__count">{total(c)}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Delegated arrow keys for the focusable card bodies inside; the board itself is not a control. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={board} class="ca-kanban__board" {@attach pan} {@attach dnd.scroller(() => ({ axis: 'x', disabled: mobile }))} onscroll={measureFade} onkeydown={onBoardKeydown}>
    {#each columns as c (c.id)}
      <section
        class="ca-kanban__col"
        data-kanban-column={c.id}
        id={mobile ? `${uid}-panel-${c.id}` : undefined}
        role={mobile ? 'tabpanel' : undefined}
        aria-labelledby={mobile ? `${uid}-tab-${c.id}` : `${uid}-h-${c.id}`}
        aria-busy={c.loading || c.loadingMore ? 'true' : undefined}
        hidden={mobile && c.id !== current?.id}
        style:--ca-kanban-color={c.color}
      >
        {#if !mobile}
          <header class="ca-kanban__head">
            {#if header}
              {@render header(c)}
            {:else}
              <span class="ca-kanban__rail" aria-hidden="true"></span>
              <svelte:element this={`h${level}`} class="ca-kanban__title" id="{uid}-h-{c.id}">{c.label}</svelte:element>
              <span class="ca-kanban__count">{total(c)}</span>
              {#if summary}
                <span class="ca-kanban__summary">{@render summary(c)}</span>
              {/if}
            {/if}
          </header>
        {:else if summary}
          <div class="ca-kanban__summary ca-kanban__summary--row">{@render summary(c)}</div>
        {/if}

        <ul
          class="ca-kanban__list"
          aria-label={t().kanban.column(c.label, total(c))}
          {@attach (node) => nearEndWatch(node, () => c)}
          {@attach dnd.sortable(() => ({
            id: c.id,
            group: 'kanban',
            label: c.label,
            drop,
            // A link card keeps Enter for the link (Space lifts); the body is then the handle, because an
            // anchor is neither the item nor a button.
            handle: cardHref ? '.ca-kanban__body' : undefined,
            liftKeys: cardHref ? [' '] : undefined,
            disabled: !canMove,
            getItems: () => c.items.map(getId),
            getLabel: cardName,
            onDrop: ondrop,
          }))}
        >
          {#if c.loading}
            {#each { length: 3 } as _, i (i)}
              <li class="ca-kanban__skeleton" aria-hidden="true"></li>
            {/each}
          {:else}
            {#each c.items as item (getId(item))}
              {@const id = getId(item)}
              {@const href = cardHref?.(item)}
              <li class="ca-kanban__card" data-dnd-item={id} data-card-id={id}>
                {#if canMove && href}
                  <a class="ca-kanban__body" {href} aria-describedby={dnd.instructionsId} draggable="false">
                    {@render card(item, { dragging: dnd.active === id, active: dnd.active !== null })}
                  </a>
                {:else if canMove}
                  <div
                    class="ca-kanban__body"
                    tabindex="0"
                    role="button"
                    aria-describedby={dnd.instructionsId}
                  >
                    {@render card(item, { dragging: dnd.active === id, active: dnd.active !== null })}
                  </div>
                {:else if href}
                  <a class="ca-kanban__body" {href} draggable="false">
                    {@render card(item, { dragging: false, active: false })}
                  </a>
                {:else}
                  <div class="ca-kanban__body">
                    {@render card(item, { dragging: false, active: false })}
                  </div>
                {/if}
                {#if canMove}
                  <DropdownMenu side="bottom" align="end">
                    {#snippet triggerChild(props)}
                      <button
                        type="button"
                        class="ca-kanban__move"
                        aria-label={t().kanban.moveTo(cardName(id))}
                        {...props}
                      >
                        <EllipsisVertical size={16} aria-hidden="true" />
                      </button>
                    {/snippet}
                    <DropdownMenuLabel>{t().kanban.moveToLabel}</DropdownMenuLabel>
                    {#each columns.filter((o) => o.id !== c.id) as o (o.id)}
                      <DropdownMenuItem onclick={() => moveTo(id, o)}>{o.label}</DropdownMenuItem>
                    {/each}
                  </DropdownMenu>
                {/if}
              </li>
            {:else}
              <li class="ca-kanban__empty">
                {#if empty}
                  {@render empty(c, { canMove })}
                {:else}
                  {t().kanban.empty}
                {/if}
              </li>
            {/each}
            {#if c.loadingMore}
              {#each { length: 2 } as _, i (i)}
                <li class="ca-kanban__skeleton" aria-hidden="true"></li>
              {/each}
            {/if}
          {/if}
        </ul>

        {#if c.hasMore && !c.loading}
          <button type="button" class="ca-kanban__more" disabled={c.loadingMore} onclick={() => loadMore(c)}>
            {c.loadingMore ? t().kanban.loadingMore : t().kanban.loadMore(Math.max(0, total(c) - c.items.length))}
          </button>
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  .ca-kanban {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    /* The columns scroll inside the board: they must never feed their width into a flex/grid parent's
       intrinsic size (an auto-width wrapper would otherwise widen the page). The board fills the width
       its parent gives it. In a shrink-to-fit parent (a flex item with no width) containment makes the
       intrinsic width 0, so it gets one column of floor; a narrower parent still shrinks it. */
    contain: inline-size;
    contain-intrinsic-inline-size: 15rem;
  }

  /* ── Board: horizontal scroller with an edge fade only where content is hidden ── */
  .ca-kanban__board {
    display: flex;
    flex: 1;
    gap: var(--ca-kanban-gap, var(--ca-space-3));
    min-height: 0;
    padding: var(--ca-space-1);
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-padding-inline: var(--ca-space-3);
    cursor: grab;
  }
  .ca-kanban__board[data-panning] { cursor: grabbing; user-select: none; }
  .ca-kanban[data-fade='end'] .ca-kanban__board {
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-space-8)), transparent);
    mask-image: linear-gradient(to right, #000 calc(100% - var(--ca-space-8)), transparent);
  }
  .ca-kanban[data-fade='start'] .ca-kanban__board {
    -webkit-mask-image: linear-gradient(to left, #000 calc(100% - var(--ca-space-8)), transparent);
    mask-image: linear-gradient(to left, #000 calc(100% - var(--ca-space-8)), transparent);
  }
  .ca-kanban[data-fade='both'] .ca-kanban__board {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-8), #000 calc(100% - var(--ca-space-8)), transparent);
    mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-8), #000 calc(100% - var(--ca-space-8)), transparent);
  }

  /* ── Column ── */
  .ca-kanban__col {
    --ca-kanban-color: var(--ca-outline-strong);
    display: flex;
    flex: none;
    flex-direction: column;
    width: var(--ca-kanban-col-width, clamp(15rem, 22vw, 20rem));
    min-height: 0;
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-sunken, var(--ca-surface-base));
    cursor: auto;
  }
  .ca-kanban__col[hidden] { display: none; }
  /* Flat: no column panel, the cards sit straight on the page. */
  .ca-kanban--flat .ca-kanban__col { border-color: transparent; border-width: 0; background: transparent; border-radius: 0; }
  /* Bare cards: the card snippet draws its own box. */
  .ca-kanban--bare .ca-kanban__card { border-width: 0; background: transparent; border-radius: 0; }
  .ca-kanban__head {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2);
    flex: none;
    min-height: var(--ca-space-10);
    padding: 0 var(--ca-space-3);
  }
  .ca-kanban__rail {
    align-self: stretch;
    width: var(--ca-space-1);
    margin-block: var(--ca-space-2);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-kanban-color);
  }
  .ca-kanban__title {
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
  }
  .ca-kanban__count {
    font-size: var(--ca-font-size-caption);
    font-variant-numeric: tabular-nums;
    color: var(--ca-text-secondary);
  }

  .ca-kanban__summary {
    flex: none;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--ca-font-size-caption);
    font-variant-numeric: tabular-nums;
    color: var(--ca-text-secondary);
  }
  .ca-kanban__summary--row {
    max-width: none;
    padding: var(--ca-space-2) var(--ca-space-3) 0;
  }

  /* ── Card list: scrolls on its own ── */
  .ca-kanban__list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--ca-space-2);
    min-height: var(--ca-space-16);
    margin: 0;
    padding: var(--ca-space-2);
    overflow-y: auto;
    overscroll-behavior-y: contain;
    list-style: none;
    border-radius: var(--ca-radius-md);
  }
  .ca-kanban__list[data-dnd-over] {
    outline: 2px dashed var(--ca-brand-fill);
    outline-offset: calc(-1 * var(--ca-space-1));
    background: var(--ca-action-hover);
  }
  .ca-kanban__card {
    position: relative;
    display: flex;
    align-items: flex-start;
    flex: none;
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
  }
  .ca-kanban__body {
    flex: 1;
    min-width: 0;
    min-height: var(--ca-touch-target);
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    cursor: grab;
  }
  a.ca-kanban__body { display: block; color: inherit; text-decoration: none; }
  .ca-kanban__body:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
  .ca-kanban__move {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--ca-touch-target);
    min-height: var(--ca-touch-target);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-secondary);
    cursor: pointer;
  }
  .ca-kanban__move:hover { background: var(--ca-action-hover); color: var(--ca-text-primary); }
  .ca-kanban__move:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: -2px; }
  .ca-kanban__empty {
    display: grid;
    place-items: center;
    padding: var(--ca-space-6) var(--ca-space-3);
    color: var(--ca-text-hint);
    font-size: var(--ca-font-size-caption);
    text-align: center;
  }
  .ca-kanban__skeleton {
    flex: none;
    height: var(--ca-space-16);
    border-radius: var(--ca-radius-md);
    background: var(--ca-action-hover);
    animation: ca-skeleton-pulse var(--ca-duration-loop) var(--ca-ease-standard) infinite;
  }
  .ca-kanban__more {
    all: unset;
    box-sizing: border-box;
    flex: none;
    margin: 0 var(--ca-space-2) var(--ca-space-2);
    min-height: var(--ca-touch-target);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-label);
    cursor: pointer;
  }
  .ca-kanban__more:hover:not(:disabled) { background: var(--ca-action-hover); color: var(--ca-text-primary); }
  .ca-kanban__more:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: -2px; }
  .ca-kanban__more:disabled { cursor: progress; color: var(--ca-text-hint); }

  /* ── Mobile: tab strip + one column ── */
  .ca-kanban__tabs {
    display: flex;
    flex: none;
    gap: var(--ca-space-1);
    padding: var(--ca-space-1);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ca-kanban__tab {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: var(--ca-space-2);
    min-height: var(--ca-touch-target);
    padding: 0 var(--ca-space-3);
    border-radius: var(--ca-radius-pill);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-label);
    cursor: pointer;
  }
  .ca-kanban__tab[aria-selected='true'] { background: var(--ca-action-selected); color: var(--ca-text-primary); }
  .ca-kanban__tab:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: -2px; }
  .ca-kanban__dot {
    width: var(--ca-space-2);
    height: var(--ca-space-2);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-kanban-color, var(--ca-outline-strong));
  }
  .ca-kanban--mobile .ca-kanban__board {
    overflow-x: hidden;
    cursor: auto;
    -webkit-mask-image: none;
    mask-image: none;
  }
  .ca-kanban--mobile .ca-kanban__col { flex: 1; width: auto; min-width: 0; }

  @media (prefers-reduced-motion: reduce) {
    .ca-kanban__skeleton { animation: none; }
    .ca-kanban__board { scroll-behavior: auto; }
  }

  @media (forced-colors: active) {
    .ca-kanban__col, .ca-kanban__card { border-color: CanvasText; }
    .ca-kanban__rail, .ca-kanban__dot { background: Highlight; forced-color-adjust: none; }
    .ca-kanban__tab[aria-selected='true'] { outline: 2px solid Highlight; }
    .ca-kanban__list[data-dnd-over] { outline-color: Highlight; }
  }
}
</style>

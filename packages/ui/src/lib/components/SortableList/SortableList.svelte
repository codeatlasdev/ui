<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface SortableListReorder {
    id: string;
    from: number;
    to: number;
  }

  export interface SortableListRowState {
    /** This row is being dragged. */
    dragging: boolean;
    index: number;
    count: number;
  }
</script>

<script lang="ts" generics="T">
  import { EllipsisVertical, GripVertical } from '@lucide/svelte';
  import { sortableList } from '../../i18n/groups/sortableList.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import type { DndDropEvent } from '../../primitives/dnd.js';
  import { useDnd } from '../../primitives/dnd.svelte.js';
  import { announce } from '../../utils/announce.js';
  import DndLayer from '../DragAndDrop/DndLayer.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';

  interface Props {
    items: T[];
    /** Stable id of an item. */
    getId: (item: T) => string;
    /**
     * A row moved (drag, keyboard or the "Reorder" menu). Apply it to your data: the list does not
     * reorder `items` itself, so you can persist first and roll back on failure.
     */
    onreorder: (move: SortableListReorder) => void;
    /** Accessible name of the list. */
    label: string;
    /** Name of a row, for the handle, the menu and the announcements. Default: the row's text. */
    getLabel?: (item: T) => string;
    /** Row content. The grip and the reorder menu are the list's. */
    item: Snippet<[T, SortableListRowState]>;
    /** Heading level is the app's: the list renders none. */
    class?: string;
  }

  let { items, getId, onreorder, label, getLabel, item, class: className = '' }: Props = $props();

  const t = useMessages(sortableList);
  const dnd = useDnd();
  const uid = $props.id();
  let root = $state<HTMLElement>();

  const nameOf = (id: string) => {
    const hit = items.find((x) => getId(x) === id);
    if (hit && getLabel) return getLabel(hit);
    const el = root?.querySelector(`[data-dnd-item="${CSS.escape(id)}"] .ca-sortable__content`);
    return (el?.textContent ?? id).trim().replace(/\s+/g, ' ') || id;
  };

  function ondrop(e: DndDropEvent) {
    if (e.from.index === e.to.index) return;
    onreorder({ id: e.id, from: e.from.index, to: e.to.index });
  }

  /** The non-drag path: menu moves are announced here, drag and keyboard moves by the engine. */
  function moveTo(id: string, from: number, to: number) {
    const target = Math.max(0, Math.min(items.length - 1, to));
    if (target === from) return;
    onreorder({ id, from, to: target });
    announce(t().sortableList.moved(nameOf(id), target + 1, items.length));
  }
</script>

<DndLayer {dnd} />
<ul
  bind:this={root}
  class="ca-sortable {className}"
  aria-label={label}
  {@attach dnd.sortable(() => ({
    id: uid,
    label,
    drop: 'position',
    handle: '.ca-sortable__grip',
    getItems: () => items.map(getId),
    getLabel: nameOf,
    onDrop: ondrop,
  }))}
>
  {#each items as it, index (getId(it))}
    {@const id = getId(it)}
    <li class="ca-sortable__row" data-dnd-item={id} data-dragging={dnd.active === id ? '' : undefined}>
      <button
        type="button"
        class="ca-sortable__grip"
        aria-label={t().sortableList.move(nameOf(id))}
        aria-describedby={dnd.instructionsId}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <div class="ca-sortable__content">
        {@render item(it, { dragging: dnd.active === id, index, count: items.length })}
      </div>
      <DropdownMenu side="bottom" align="end">
        {#snippet triggerChild(props)}
          <button
            type="button"
            class="ca-sortable__menu"
            aria-label={t().sortableList.reorder(nameOf(id))}
            {...props}
          >
            <EllipsisVertical size={16} aria-hidden="true" />
          </button>
        {/snippet}
        <DropdownMenuItem disabled={index === 0} onclick={() => moveTo(id, index, 0)}>
          {t().sortableList.moveFirst}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === 0} onclick={() => moveTo(id, index, index - 1)}>
          {t().sortableList.moveUp}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === items.length - 1} onclick={() => moveTo(id, index, index + 1)}>
          {t().sortableList.moveDown}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === items.length - 1} onclick={() => moveTo(id, index, items.length - 1)}>
          {t().sortableList.moveLast}
        </DropdownMenuItem>
      </DropdownMenu>
    </li>
  {/each}
</ul>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  .ca-sortable {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ca-sortable__row {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--ca-space-1);
    padding: var(--ca-space-2);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
  }
  .ca-sortable__row[data-dragging] { opacity: 0.5; }
  .ca-sortable__content { flex: 1; min-width: 0; }

  .ca-sortable__grip,
  .ca-sortable__menu {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--ca-space-6);
    min-height: var(--ca-space-8);
    border-radius: var(--ca-radius-sm);
    color: var(--ca-text-hint);
    cursor: pointer;
  }
  .ca-sortable__grip { cursor: grab; touch-action: none; }
  .ca-sortable__grip:hover,
  .ca-sortable__menu:hover { background: var(--ca-action-hover); color: var(--ca-text-primary); }
  .ca-sortable__grip:focus-visible,
  .ca-sortable__menu:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: -2px; }

  /* Touch: the grip starts a drag at once (no hold) and both controls meet the touch target. */
  @media (pointer: coarse) {
    .ca-sortable__grip,
    .ca-sortable__menu { width: var(--ca-touch-target); min-height: var(--ca-touch-target); }
  }

  @media (forced-colors: active) {
    .ca-sortable__row { border-color: CanvasText; }
  }
}
</style>

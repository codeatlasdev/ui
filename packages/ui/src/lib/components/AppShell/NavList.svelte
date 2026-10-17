<script lang="ts">
  import type { NavItem, NavReorderEvent } from './types.js';
  import { isItemActive } from './types.js';
  import { useDnd } from '../../primitives/dnd.svelte.js';
  import type { DndDropEvent } from '../../primitives/dnd.js';
  import DndLayer from '../DragAndDrop/DndLayer.svelte';
  import PanelNavItem from './PanelNavItem.svelte';

  interface Props {
    items:       NavItem[];
    pathname:    string;
    /** Makes the list reorderable: grips, drag and keyboard moves. */
    onReorder?:  (e: NavReorderEvent) => void;
    /** Container id for the drag announcements. */
    label?:      string;
    /** Match a link as active by exact/nested path (Panel's loose items) instead of `isItemActive`. */
    active?:     (item: NavItem) => boolean;
  }

  let { items, pathname, onReorder, label = '', active }: Props = $props();

  const dnd = useDnd();
  const labelOf = (id: string) => items.find((i) => i.id === id)?.label ?? id;

  function drop(e: DndDropEvent) {
    if (e.from.index === e.to.index) return;
    onReorder?.({ id: e.id, from: e.from.index, to: e.to.index });
  }
</script>

{#if onReorder}
  <DndLayer {dnd} />
  <div
    class="ca-nav-list"
    {@attach dnd.sortable(() => ({
      id: label || 'nav',
      label,
      getItems: () => items.map((i) => i.id),
      getLabel: labelOf,
      handle: '.ca-nav-item__grip',
      onDrop: drop,
    }))}
  >
    {#each items as item (item.id)}
      <PanelNavItem
        {item}
        isActive={active ? active(item) : isItemActive(item, pathname)}
        href={item.path}
        grip
        describedby={dnd.instructionsId}
      />
    {/each}
  </div>
{:else}
  {#each items as item (item.id)}
    <PanelNavItem
      {item}
      isActive={active ? active(item) : isItemActive(item, pathname)}
      href={item.path}
    />
  {/each}
{/if}

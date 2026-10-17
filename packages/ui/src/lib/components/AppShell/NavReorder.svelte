<script lang="ts">
  // Opt-in: pass `reorder={NavReorder}` to AppShellLayout. Shells that never reorder do not import
  // it, so the drag engine stays out of their bundle (size budget "root: AppShellLayout").
  import { useDnd } from '../../primitives/dnd.svelte.js';
  import type { DndDropEvent } from '../../primitives/dnd.js';
  import DndLayer from '../DragAndDrop/DndLayer.svelte';
  import PanelNavItem from './PanelNavItem.svelte';
  import type { NavReorderProps } from './types.js';

  let { items, onReorder, label, isActive }: NavReorderProps = $props();

  const dnd = useDnd();
  const labelOf = (id: string) => items.find((i) => i.id === id)?.label ?? id;

  function drop(e: DndDropEvent) {
    if (e.from.index === e.to.index) return;
    onReorder({ id: e.id, from: e.from.index, to: e.to.index });
  }
</script>

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
    <PanelNavItem {item} isActive={isActive(item)} href={item.path} grip describedby={dnd.instructionsId} />
  {/each}
</div>

<script lang="ts">
  import { applyMove, DndLayer, useDnd, type DndDropEvent } from '@codeatlasdev/ui';
  import { GripVertical } from '@lucide/svelte';

  type Task = { id: string; title: string };
  let tasks = $state<Task[]>([
    { id: 't1', title: 'Review the pull request' },
    { id: 't2', title: 'Write the release notes' },
    { id: 't3', title: 'Update the changelog' },
    { id: 't4', title: 'Tag the release' },
  ]);

  const dnd = useDnd();

  function onDrop(e: DndDropEvent) {
    tasks = applyMove({ list: tasks }, e, (t) => t.id).list;
  }
</script>

<DndLayer {dnd} />
<ul
  class="sl"
  aria-label="Release checklist"
  {@attach dnd.sortable(() => ({ id: 'list', label: 'Release checklist', handle: '.sl__grip', getItems: () => tasks.map((t) => t.id), getLabel: (id) => tasks.find((t) => t.id === id)?.title ?? id, onDrop }))}
>
  {#each tasks as task (task.id)}
    <li class="sl__row" data-dnd-item={task.id}>
      <button class="sl__grip" type="button" aria-label="Move {task.title}" aria-describedby={dnd.instructionsId}>
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <span>{task.title}</span>
    </li>
  {/each}
</ul>

<style>
  .sl { width: 100%; max-width: 360px; margin: 0; padding: 0; list-style: none; display: grid; gap: var(--ca-space-2); }
  .sl__row {
    display: flex; align-items: center; gap: var(--ca-space-2);
    padding: var(--ca-space-2) var(--ca-space-3);
    background: var(--ca-surface-raised); border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
  }
  .sl__grip {
    display: grid; place-items: center; padding: var(--ca-space-1); min-width: var(--ca-touch-target); min-height: var(--ca-touch-target);
    color: var(--ca-text-secondary); background: none; border: 0; border-radius: var(--ca-radius-sm);
    cursor: grab; touch-action: none;
  }
</style>

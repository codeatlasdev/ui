<script lang="ts">
  import { DndLayer, useDnd, type DndDropEvent } from '@codeatlasdev/ui';

  const days = ['Mon', 'Tue', 'Wed', 'Thu'];
  const tasks = [
    { id: 'standup', title: 'Stand-up' },
    { id: 'review', title: 'Design review' },
    { id: 'demo', title: 'Demo prep' },
  ];
  let placed = $state<Record<string, string>>({});

  const dnd = useDnd();

  function drop(day: string, e: DndDropEvent) {
    placed = { ...placed, [e.id]: day };
  }
  const unplaced = $derived(tasks.filter((t) => !placed[t.id]));
</script>

<DndLayer {dnd} />
<div class="dz">
  <ul class="dz__tray" aria-label="Unscheduled">
    {#each unplaced as t (t.id)}
      <li class="dz__chip" data-dnd-item={t.id} {@attach dnd.draggable(() => ({ id: t.id, label: t.title }))}>
        <button type="button" class="dz__btn" aria-describedby={dnd.instructionsId}>{t.title}</button>
      </li>
    {/each}
    {#if unplaced.length === 0}<li class="dz__empty">Everything is scheduled</li>{/if}
  </ul>
  <div class="dz__days">
    {#each days as day (day)}
      <div class="dz__day" role="group" aria-label={day} {@attach dnd.dropzone(() => ({ id: day, label: day, onDrop: (e) => drop(day, e) }))}>
        <strong>{day}</strong>
        <ul class="dz__placed">
          {#each tasks.filter((t) => placed[t.id] === day) as t (t.id)}<li>{t.title}</li>{/each}
        </ul>
      </div>
    {/each}
  </div>
</div>

<style>
  .dz { display: grid; gap: var(--ca-space-4); width: 100%; }
  .dz__tray { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: var(--ca-space-2); min-height: 2.75rem; }
  .dz__chip { background: var(--ca-brand-fill); color: var(--ca-brand-contrast); border-radius: var(--ca-radius-pill); }
  .dz__btn { all: unset; box-sizing: border-box; min-height: var(--ca-touch-target); display: flex; align-items: center; padding: var(--ca-space-2) var(--ca-space-4); cursor: grab; touch-action: manipulation; border-radius: var(--ca-radius-pill); }
  .dz__btn:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 2px; }
  .dz__empty { color: var(--ca-text-secondary); align-self: center; }
  .dz__days { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: var(--ca-space-2); }
  .dz__day { min-height: 6rem; padding: var(--ca-space-2); background: var(--ca-surface-raised); border: var(--ca-border-width) solid var(--ca-outline-subtle); border-radius: var(--ca-radius-md); display: grid; align-content: start; gap: var(--ca-space-1); }
  .dz__placed { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--ca-space-1); font-size: var(--ca-font-size-body2); }
</style>

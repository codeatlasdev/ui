<script lang="ts">
  import { Trash2 } from '@lucide/svelte';
  import { EditableRow, IconButton, NumberField, Select, SortableList, TextField } from '@codeatlasdev/ui';
  import type { SortableListReorder } from '@codeatlasdev/ui';

  type Stage = { id: string; name: string; kind: string; staleDays: number };
  let stages = $state<Stage[]>([
    { id: 'new', name: 'New', kind: 'open', staleDays: 3 },
    { id: 'talk', name: 'Talking', kind: 'open', staleDays: 7 },
    { id: 'won', name: 'Won', kind: 'won', staleDays: 0 },
    { id: 'lost', name: 'Lost', kind: 'lost', staleDays: 0 },
  ]);
  const kinds = [
    { value: 'open', label: 'Open' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ];

  // Optimistic reorder: apply it, persist, and put the old order back when the save fails.
  async function reorder({ from, to }: SortableListReorder) {
    const before = stages;
    const next = [...stages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    stages = next;
    try {
      await save(next);
    } catch {
      stages = before;
    }
  }
  const save = (_: Stage[]) => Promise.resolve();
</script>

<div class="stages">
  <SortableList items={stages} getId={(s) => s.id} getLabel={(s) => s.name} onreorder={reorder} label="Pipeline stages">
    {#snippet item(stage)}
      <EditableRow label={stage.name}>
        {#snippet summary()}<strong>{stage.name}</strong>{/snippet}
        <TextField label="Name" bind:value={stage.name} />
        <Select label="Kind" options={kinds} bind:value={stage.kind} />
        <NumberField label="Stale after (days)" bind:value={stage.staleDays} min={0} />
        {#snippet actions()}
          <IconButton variant="ghost" aria-label="Delete {stage.name}" onclick={() => (stages = stages.filter((s) => s.id !== stage.id))}>
            <Trash2 size={16} />
          </IconButton>
        {/snippet}
      </EditableRow>
    {/snippet}
  </SortableList>
</div>

<style>
  .stages { width: 100%; }
</style>

<script lang="ts">
  import { createRawSnippet } from 'svelte';
  import { renderComponent } from '@tanstack/svelte-table';
  import { Button } from '@codeatlasdev/ui';
  import { DataTable, DataTableColumnHeader, createCaColumnHelper, type DataTableReorderEvent } from '@codeatlasdev/ui/table';

  interface Task {
    id: string;
    title: string;
    owner: string;
    sprint: string;
  }

  let tasks = $state<Task[]>([
    { id: 't1', title: 'Audit contrast tokens', owner: 'Ana', sprint: 'Backlog' },
    { id: 't2', title: 'Write the export guide', owner: 'Bruno', sprint: 'Backlog' },
    { id: 't3', title: 'Ship the date picker fix', owner: 'Carla', sprint: 'Backlog' },
    { id: 't4', title: 'Wire the plugin install', owner: 'Diego', sprint: 'Sprint 12' },
    { id: 't5', title: 'Review the rail magnification', owner: 'Elena', sprint: 'Sprint 12' },
  ]);
  let last = $state('Nothing opened yet');

  const col = createCaColumnHelper<Task>();
  const columns = col.columns([
    col.accessor('title', {
      header: ({ column }) => renderComponent(DataTableColumnHeader<Task, string>, { column, title: 'Task' }),
      meta: { label: 'Task', resizable: true },
      size: 320,
      minSize: 160,
      maxSize: 560,
    }),
    col.accessor('owner', { header: 'Owner', meta: { label: 'Owner' } }),
    col.display({
      id: 'open',
      header: 'Details',
      cell: ({ row }) =>
        renderComponent(Button, {
          size: 'sm',
          variant: 'outlined',
          children: createRawSnippet(() => ({ render: () => '<span>Open</span>' })),
          'aria-label': `Open ${row.original.title}`,
          onclick: () => (last = `Opened ${row.original.title}`),
        }),
    }),
  ]);

  function onReorder(e: DataTableReorderEvent) {
    const item = tasks.find((t) => t.id === e.id);
    if (!item) return;
    const rest = tasks.filter((t) => t.id !== e.id);
    const target = e.to.group ?? item.sprint;
    const before = rest.filter((t) => t.sprint === target)[e.to.index];
    item.sprint = target;
    rest.splice(before ? rest.indexOf(before) : rest.length, 0, item);
    tasks = rest;
  }
</script>

<div class="wrap">
  <DataTable
    {columns}
    data={tasks}
    rowId={(t) => t.id}
    groupBy={(t) => t.sprint}
    {onReorder}
    onRowClick={(t) => (last = `Selected ${t.title}`)}
  />
  <p class="note" aria-live="polite">{last}</p>
</div>

<style>
  .wrap { width: 100%; min-width: 0; display: grid; gap: var(--ca-space-2); }
  .note { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>

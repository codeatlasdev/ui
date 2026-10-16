<script lang="ts">
  import {
    Avatar, DropdownMenu, DropdownMenuItem, IconButton, RecordCell, RecordList, RecordRow, StatusChip,
  } from '@codeatlasdev/ui';
  import { MoreHorizontal } from '@lucide/svelte';

  const apps = [
    { id: 1, name: 'Billing', scopes: 'read:invoices write:invoices', installs: 128, created: 'Mar 14, 2026', live: true },
    { id: 2, name: 'Support desk', scopes: 'read:tickets', installs: 7, created: 'Apr 2, 2026', live: true },
    { id: 3, name: 'Analytics exporter', scopes: 'read:events read:users', installs: 0, created: 'May 21, 2026', live: false },
  ];
</script>

<RecordList
  columns="minmax(0,1.3fr) minmax(0,1.8fr) 4.5rem 5.5rem 6.5rem 2.75rem"
  labels={['App', 'Scopes', 'Installs', 'Status', 'Created']}
  aria-label="Apps"
>
  {#each apps as app (app.id)}
    <RecordRow>
      {#snippet identity()}
        <span class="who"><Avatar alt={app.name} size="sm" /> <strong>{app.name}</strong></span>
      {/snippet}
      <RecordCell label="Scopes"><code>{app.scopes}</code></RecordCell>
      <RecordCell label="Installs">{app.installs}</RecordCell>
      <RecordCell label="Status">
        <StatusChip status={app.live ? 'success' : 'neutral'} label={app.live ? 'Live' : 'Draft'} />
      </RecordCell>
      <RecordCell label="Created">{app.created}</RecordCell>
      {#snippet actions()}
        <DropdownMenu align="end">
          {#snippet triggerChild(props)}
            <IconButton aria-label={`Actions for ${app.name}`} {...props}><MoreHorizontal size={18} /></IconButton>
          {/snippet}
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Rotate secret</DropdownMenuItem>
        </DropdownMenu>
      {/snippet}
    </RecordRow>
  {/each}
</RecordList>

<style>
  .who { display: flex; align-items: center; gap: var(--ca-space-2); min-width: 0; }
  code { font-size: var(--ca-font-size-caption); }
</style>

<script lang="ts">
  import {
    Avatar, Button, Card, DropdownMenu, DropdownMenuItem, IconButton, PageShell, RecordCell, RecordList, RecordRow, StatusChip,
  } from '@codeatlasdev/ui';
  import { MoreHorizontal, Pencil } from '@lucide/svelte';

  const m = {
    back: 'Back to companies',
    title: 'Atlas Co',
    description: 'Customer since March 2026.',
    edit: 'Edit',
    aside: 'Company summary',
    summary: { title: 'Summary', owner: 'Owner', plan: 'Plan', since: 'Customer since' },
    contacts: { title: 'Contacts', list: 'Contacts', labels: ['Contact', 'Role', 'Last seen'], role: 'Role', seen: 'Last seen' },
    actions: (name: string) => `Actions for ${name}`,
    open: 'Open',
    remove: 'Remove',
  };

  const company = { owner: 'Ana Lima', plan: 'Business', since: 'Mar 14, 2026' };
  const contacts = [
    { id: 1, name: 'Maria Souza', role: 'Finance lead', seen: 'Today', active: true },
    { id: 2, name: 'João Lima', role: 'Developer', seen: 'Yesterday', active: true },
    { id: 3, name: 'Ana Costa', role: 'Procurement', seen: 'Oct 28', active: false },
  ];
</script>

<div class="record-stage">
  <PageShell title={m.title} description={m.description} backHref="/companies" backLabel={m.back} asideLabel={m.aside}>
    {#snippet actions()}
      <Button variant="outlined" size="sm">
        {#snippet leading()}<Pencil size={14} />{/snippet}
        {m.edit}
      </Button>
    {/snippet}

    {#snippet aside()}
      <Card full title={m.summary.title} headingLevel={2}>
        <dl class="record-facts">
          <dt>{m.summary.owner}</dt><dd>{company.owner}</dd>
          <dt>{m.summary.plan}</dt><dd>{company.plan}</dd>
          <dt>{m.summary.since}</dt><dd>{company.since}</dd>
        </dl>
      </Card>
    {/snippet}

    <Card full flush title={m.contacts.title} headingLevel={2}>
      <RecordList columns="minmax(0,1.4fr) minmax(0,1fr) 6rem" actions labels={m.contacts.labels} aria-label={m.contacts.list}>
        {#each contacts as c (c.id)}
          <RecordRow>
            {#snippet identity()}
              <span class="record-who"><Avatar alt={c.name} size="sm" decorative /> <strong>{c.name}</strong></span>
            {/snippet}
            <RecordCell label={m.contacts.role}>{c.role}</RecordCell>
            <RecordCell label={m.contacts.seen}>{c.seen}</RecordCell>
            {#snippet actions()}
              <DropdownMenu align="end">
                {#snippet triggerChild(props)}
                  <IconButton aria-label={m.actions(c.name)} {...props}><MoreHorizontal size={18} /></IconButton>
                {/snippet}
                <DropdownMenuItem>{m.open}</DropdownMenuItem>
                <DropdownMenuItem>{m.remove}</DropdownMenuItem>
              </DropdownMenu>
            {/snippet}
          </RecordRow>
        {/each}
      </RecordList>
    </Card>
  </PageShell>
</div>

<style>
  /* Demo frame only: in a route the shell already fills the page. */
  .record-stage {
    --ca-vh: 30rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 30rem;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .record-who { display: flex; align-items: center; gap: var(--ca-space-2); min-width: 0; }
  .record-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ca-space-2) var(--ca-space-4); margin: 0; font-size: var(--ca-font-size-body2); }
  .record-facts dt { color: var(--ca-text-secondary); }
  .record-facts dd { margin: 0; color: var(--ca-text-primary); }
</style>

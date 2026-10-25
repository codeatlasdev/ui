<script lang="ts">
  import { Avatar, Button, Chip, Heading, IconButton, StatusChip, TextField } from '@codeatlasdev/ui';
  import { BarChart3, Home, Inbox, MoreHorizontal, Plus, Search, Settings, Users } from '@lucide/svelte';

  let query = $state('');

  const nav = [
    { label: 'Home', icon: Home, current: false },
    { label: 'People', icon: Users, current: true },
    { label: 'Inbox', icon: Inbox, current: false },
    { label: 'Reports', icon: BarChart3, current: false },
    { label: 'Settings', icon: Settings, current: false },
  ];

  const people = [
    { name: 'Ana Lima', role: 'Design lead', status: 'success', label: 'Active', tag: 'Design' },
    { name: 'Carlos Melo', role: 'Backend engineer', status: 'success', label: 'Active', tag: 'Engineering' },
    { name: 'Diana Kwan', role: 'Product manager', status: 'warning', label: 'Invited', tag: 'Product' },
    { name: 'Eduardo Silva', role: 'Support', status: 'neutral', label: 'Paused', tag: 'Ops' },
    { name: 'Fiona Clarke', role: 'Frontend engineer', status: 'success', label: 'Active', tag: 'Engineering' },
  ] as const;

  const shown = $derived(
    people.filter((p) => `${p.name} ${p.role}`.toLowerCase().includes(query.trim().toLowerCase()))
  );
</script>

<section class="ts-list" aria-label="People list preview">
  <nav class="ts-list__nav" aria-label="Preview navigation">
    <span class="ts-list__brand">Atlas</span>
    <ul class="ts-list__links">
      {#each nav as item (item.label)}
        {@const Icon = item.icon}
        <li>
          <a href="#people" class="ts-list__link" aria-current={item.current ? 'page' : undefined}>
            <Icon size={16} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="ts-list__main">
    <header class="ts-list__bar">
      <Heading level={2} size="h4">People</Heading>
      <div class="ts-list__tools">
        <div class="ts-list__search">
          <TextField label="Search people" hideLabel placeholder="Search people" bind:value={query} size="sm">
            {#snippet leading()}<Search size={14} aria-hidden="true" />{/snippet}
          </TextField>
        </div>
        <Button size="sm">
          {#snippet leading()}<Plus size={14} />{/snippet}
          Invite
        </Button>
      </div>
    </header>

    <ul class="ts-list__rows" aria-label="People">
      {#each shown as p (p.name)}
        <li class="ts-list__row">
          <Avatar alt={p.name} size="md" />
          <div class="ts-list__who">
            <span class="ts-list__name">{p.name}</span>
            <span class="ts-list__role">{p.role}</span>
          </div>
          <span class="ts-list__tag"><Chip label={p.tag} size="sm" /></span>
          <StatusChip status={p.status} label={p.label} />
          <IconButton aria-label="More actions for {p.name}" size="sm" variant="text" tone="neutral">
            <MoreHorizontal size={16} />
          </IconButton>
        </li>
      {:else}
        <li class="ts-list__empty">No one matches "{query}".</li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .ts-list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
  }
  @container ts-island (min-width: 640px) {
    .ts-list { grid-template-columns: 13rem minmax(0, 1fr); }
  }

  .ts-list__nav {
    display: grid;
    align-content: start;
    gap: var(--ca-space-3);
    padding: var(--ca-space-4);
    background: var(--ca-surface-raised);
    box-shadow: inset 0 calc(var(--ca-border-width) * -1) 0 var(--ca-outline-subtle);
    min-width: 0;
  }
  @container ts-island (min-width: 640px) {
    .ts-list__nav {
      box-shadow: inset calc(var(--ca-border-width) * -1) 0 0 var(--ca-outline-subtle);
      min-height: 24rem;
    }
  }
  .ts-list__brand {
    font-family: var(--ca-font-display);
    font-weight: var(--ca-font-weight-heading);
    font-size: var(--ca-font-size-h5);
    color: var(--ca-text-primary);
  }
  .ts-list__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ca-space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @container ts-island (min-width: 640px) {
    .ts-list__links { display: grid; }
  }
  .ts-list__link {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2);
    min-height: var(--ca-control-height);
    padding: 0 var(--ca-space-3);
    border-radius: var(--ca-radius-sm);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
    text-decoration: none;
  }
  .ts-list__link:hover { background: var(--ca-action-hover); color: var(--ca-text-primary); }
  .ts-list__link[aria-current='page'] {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }

  .ts-list__main { display: grid; align-content: start; gap: var(--ca-space-3); padding: var(--ca-space-4); min-width: 0; }
  .ts-list__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ca-space-3); }
  .ts-list__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-2); min-width: 0; }
  .ts-list__search { min-width: 0; width: 14rem; max-width: 100%; }

  .ts-list__rows { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--ca-space-1); }
  .ts-list__row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--ca-space-3);
    padding: var(--ca-space-2) var(--ca-space-3);
    border-radius: var(--ca-radius-md);
    box-shadow: inset 0 calc(var(--ca-border-width) * -1) 0 var(--ca-outline-subtle);
  }
  .ts-list__row:hover { background: var(--ca-action-hover); }
  .ts-list__tag { display: none; }
  @container ts-island (min-width: 640px) {
    .ts-list__row { grid-template-columns: auto minmax(0, 1fr) auto auto auto; }
    .ts-list__tag { display: block; }
  }
  .ts-list__who { display: grid; min-width: 0; }
  .ts-list__name { font-weight: var(--ca-font-weight-medium); color: var(--ca-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ts-list__role { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ts-list__empty { padding: var(--ca-space-6) var(--ca-space-3); text-align: center; color: var(--ca-text-secondary); }
</style>

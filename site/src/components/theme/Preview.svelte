<script lang="ts">
  import {
    Alert, Avatar, Button, Chip, GlassCard, IconButton, KpiCard, SimpleTable,
    StatusChip, Switch, TextField,
  } from '@codeatlasdev/ui';
  import { Bell, DollarSign, Plus } from '@lucide/svelte';
  import { ISLAND } from './editor-state';

  interface Props {
    /** Island-scoped CSS from `islandCSS`. */
    css: string;
    style: string;
    preset: string;
    scheme: 'light' | 'dark';
  }
  let { css, style, preset, scheme }: Props = $props();

  let name = $state('CodeAtlas');
  let email = $state('team@codeatlas.com.br');
  let notify = $state(true);

  const rows = [
    { who: 'Ana Souza', role: 'Admin', status: 'success', label: 'Active' },
    { who: 'Bruno Lima', role: 'Editor', status: 'warning', label: 'Invited' },
    { who: 'Carla Dias', role: 'Viewer', status: 'neutral', label: 'Paused' },
  ] as const;
</script>

<svelte:head>
  {@html `<style data-te-island>${css}</style>`}
</svelte:head>

<!-- The island re-derives every token from its own attributes: nothing here reaches the page. -->
<div
  class="{ISLAND} te-island"
  data-ca-tokens
  data-theme-scope={scheme}
  data-preset={preset}
  data-style={style}
  data-testid="te-island"
>
  <GlassCard title="Team settings">
    {#snippet headerActions()}
      <IconButton aria-label="Notifications" variant="glass" size="sm"><Bell size={16} /></IconButton>
    {/snippet}
    <div class="te-stack">
      <h3 class="te-heading">Invite your team</h3>
      <p class="te-body">
        Every control in this card reads its radius, density, border, type and motion from the
        theme you are editing.
      </p>
      <TextField label="Workspace name" bind:value={name} />
      <TextField label="Billing email" type="email" bind:value={email} description="Receipts go here." />
      <Switch bind:checked={notify} label="Email me about new members" />
      <div class="te-row">
        <Chip label="Design" variant="brand" />
        <Chip label="Engineering" />
        <Chip label="Ops" selected />
        <Chip label="Beta" variant="info" />
      </div>
      <div class="te-row">
        <Button>Save changes</Button>
        <Button variant="outlined">Cancel</Button>
        <Button variant="ghost">{#snippet leading()}<Plus size={16} />{/snippet}Add member</Button>
      </div>
    </div>
  </GlassCard>

  <KpiCard title="Monthly revenue" value="R$ 48,2k" trend={12.4} icon={DollarSign} />

  <Alert severity="info" title="Heads up">Changes apply to this preview only.</Alert>

  <GlassCard flush>
    <SimpleTable>
      <thead>
        <tr><th>Member</th><th>Role</th><th>Status</th></tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr>
            <td class="primary te-person"><Avatar alt={r.who} size="sm" />{r.who}</td>
            <td>{r.role}</td>
            <td><StatusChip status={r.status} label={r.label} /></td>
          </tr>
        {/each}
      </tbody>
    </SimpleTable>
  </GlassCard>
</div>

<style>
  .te-island {
    display: grid;
    gap: var(--ca-space-4);
    padding: var(--ca-space-4);
    min-width: 0;
    background: var(--ca-surface-base);
    color: var(--ca-text-primary);
    font-family: var(--ca-font-sans);
    border-radius: var(--ca-radius-lg);
  }
  @media (max-width: 899.98px) {
    .te-island { padding-inline: var(--ca-space-3); }
  }
  .te-stack { display: grid; gap: var(--ca-space-3); min-width: 0; }
  .te-row { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); align-items: center; }
  .te-heading { margin: 0; }
  .te-body { margin: 0; color: var(--ca-text-body); max-width: var(--ca-measure, none); }
  .te-person { display: flex; align-items: center; gap: var(--ca-space-2); }
</style>

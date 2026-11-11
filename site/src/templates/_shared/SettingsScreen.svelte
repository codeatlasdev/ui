<script lang="ts">
  // Settings shared by the admin and app templates: same tabs and sections; each passes its copy,
  // its language list, its sessions and the two layout switches that genuinely differ.
  import type { Snippet } from 'svelte';
  import {
    AppSettings, FormSection, TextField, Select, Switch,
    Button, SettingItem, Divider, Avatar, Flex, Chip, Card, SimpleTable,
  } from '@codeatlasdev/ui';
  import { Settings, Bell, Users, Shield, AlertTriangle, Save } from '@lucide/svelte';

  interface Props {
    langOpts: { value: string; label: string }[];
    sessions: { device: string; ip: string; last: string; current: boolean }[];
    /** Section layout of the notification/security/danger groups (the admin template uses "list"). */
    listLayout?: 'list';
    /** Wraps the IP-range field (the admin template pads it with a div); the field renders bare without it. */
    ipFieldWrap?: Snippet<[Snippet]>;
    copy: {
      timezoneLabel: string; dangerTitle: string; dangerDesc: string; deleteDesc: string;
      emailDesc: string; paymentEventsDesc: string; deployLabel: string; deployDesc: string;
      perfDesc: string; digestDesc: string; invite: string; mfaDesc: string; ssoDesc: string;
      accessTitle: string; accessDesc: string; ipLabel: string; ipDesc: string;
      ipRangesLabel: string; ipRangesDesc: string; sessionsTitle: string; currentChip: string; revoke: string;
    };
  }
  let { langOpts, sessions, listLayout, ipFieldWrap, copy }: Props = $props();

  // General
  let workspaceName = $state('CodeAtlas Inc.');
  let workspaceSlug = $state('codeatlas');
  let timezone      = $state('america-sao-paulo');
  let language      = $state('en');
  let saving        = $state(false);

  // Notifications
  let emailOnSignup  = $state(true);
  let emailOnPayment = $state(true);
  let emailOnError   = $state(false);
  let pushOnDeploy   = $state(true);
  let pushOnAlert    = $state(true);
  let weeklyDigest   = $state(true);

  // Security
  let mfa        = $state(false);
  let ssoEnabled = $state(false);
  let ipAllow    = $state(false);
  let ipRange    = $state('');

  const members = [
    { name: 'Ana Lima',    email: 'ana@acme.com',   role: 'Admin',  status: 'active'  },
    { name: 'Carlos Melo', email: 'carlos@apex.io', role: 'Editor', status: 'active'  },
    { name: 'Diana Kwan',  email: 'diana@nova.dev', role: 'Viewer', status: 'pending' },
    { name: 'Eduardo S.',  email: 'edu@mesh.ai',    role: 'Editor', status: 'active'  },
  ];

  const tzOpts   = [
    { value: 'america-sao-paulo', label: 'America/Sao_Paulo (UTC-3)' },
    { value: 'america-new-york',  label: 'America/New_York (UTC-4)'  },
    { value: 'europe-london',     label: 'Europe/London (UTC+1)'     },
    { value: 'asia-tokyo',        label: 'Asia/Tokyo (UTC+9)'        },
  ];
  const roleOpts = [
    { value: 'Admin',  label: 'Admin'  },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  const TABS = [
    { value: 'general',       label: 'General',       icon: Settings },
    { value: 'notifications', label: 'Notifications', icon: Bell     },
    { value: 'members',       label: 'Members',       icon: Users, badge: members.length },
    { value: 'security',      label: 'Security',      icon: Shield   },
  ];

  function save() { saving = true; setTimeout(() => (saving = false), 900); }
</script>

<AppSettings
  title="Settings"
  description="Manage your workspace configuration."
  tabs={TABS}
>
  {#snippet actions()}
    <Button variant="filled" size="sm" onclick={save} disabled={saving}>
      {#snippet leading()}<Save size={14} />{/snippet}
      {saving ? 'Saving…' : 'Save changes'}
    </Button>
  {/snippet}

  {#snippet children(tab)}
    <!-- ── General ──────────────────────────────────────────────── -->
    {#if tab === 'general'}
      <FormSection title="Workspace" description="Basic information about your workspace.">
        <TextField label="Workspace name" bind:value={workspaceName} />
        <TextField
          label="URL slug"
          bind:value={workspaceSlug}
          description="app.codeatlas.dev/{workspaceSlug}"
        />
        <Select label={copy.timezoneLabel} bind:value={timezone} options={tzOpts} />
        <Select label="Language" bind:value={language} options={langOpts} />
      </FormSection>

      <FormSection title={copy.dangerTitle} description={copy.dangerDesc} layout={listLayout}>
        <SettingItem
          label="Delete workspace"
          description={copy.deleteDesc}
        >
          <Button variant="outlined" size="sm" class="ca-btn-danger">
            {#snippet leading()}<AlertTriangle size={14} />{/snippet}
            Delete
          </Button>
        </SettingItem>
      </FormSection>
    {/if}

    <!-- ── Notifications ────────────────────────────────────────── -->
    {#if tab === 'notifications'}
      <FormSection title="Email" description={copy.emailDesc} layout={listLayout}>
        <SettingItem label="New user signed up" description="Email on every new registration.">
          <Switch bind:checked={emailOnSignup} />
        </SettingItem>
        <Divider />
        <SettingItem label="Payment events" description={copy.paymentEventsDesc}>
          <Switch bind:checked={emailOnPayment} />
        </SettingItem>
        <Divider />
        <SettingItem label="System errors" description="Critical errors and downtime alerts.">
          <Switch bind:checked={emailOnError} />
        </SettingItem>
      </FormSection>

      <FormSection title="Push & In-App" description="Real-time notifications inside the platform." layout={listLayout}>
        <SettingItem label={copy.deployLabel} description={copy.deployDesc}>
          <Switch bind:checked={pushOnDeploy} />
        </SettingItem>
        <Divider />
        <SettingItem label="Performance alerts" description={copy.perfDesc}>
          <Switch bind:checked={pushOnAlert} />
        </SettingItem>
        <Divider />
        <SettingItem label="Weekly digest" description={copy.digestDesc}>
          <Switch bind:checked={weeklyDigest} />
        </SettingItem>
      </FormSection>
    {/if}

    <!-- ── Members ──────────────────────────────────────────────── -->
    {#if tab === 'members'}
      <Card flush full>
        {#snippet headerActions()}
          <Button variant="filled" size="sm">{copy.invite}</Button>
        {/snippet}
        <SimpleTable>
          <thead>
            <tr><th>Member</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {#each members as m}
              <tr>
                <td>
                  <Flex gap="2.5" align="center">
                    <Avatar alt={m.name} size="sm" />
                    <div>
                      <p class="member-name">{m.name}</p>
                      <p class="member-email">{m.email}</p>
                    </div>
                  </Flex>
                </td>
                <td><Select value={m.role} options={roleOpts} /></td>
                <td>
                  <Chip
                    label={m.status === 'active' ? 'Active' : 'Pending'}
                    variant={m.status === 'active' ? 'success' : 'warning'}
                    size="sm"
                  />
                </td>
                <td><Button variant="ghost" size="sm">Remove</Button></td>
              </tr>
            {/each}
          </tbody>
        </SimpleTable>
      </Card>
    {/if}

    <!-- ── Security ─────────────────────────────────────────────── -->
    {#if tab === 'security'}
      <FormSection title="Authentication" description="Control how members sign in." layout={listLayout}>
        <SettingItem label="Two-factor authentication" description={copy.mfaDesc}>
          <Switch bind:checked={mfa} />
        </SettingItem>
        <Divider />
        <SettingItem label="Single sign-on (SSO)" description={copy.ssoDesc}>
          <Switch bind:checked={ssoEnabled} />
        </SettingItem>
      </FormSection>

      <FormSection title={copy.accessTitle} description={copy.accessDesc} layout={listLayout}>
        <SettingItem label={copy.ipLabel} description={copy.ipDesc}>
          <Switch bind:checked={ipAllow} />
        </SettingItem>
        {#if ipAllow}
          <Divider />
          {#snippet ipField()}
            <TextField
              label={copy.ipRangesLabel}
              bind:value={ipRange}
              placeholder="192.168.1.0/24, 10.0.0.1"
              description={copy.ipRangesDesc}
            />
          {/snippet}
          {#if ipFieldWrap}
            {@render ipFieldWrap(ipField)}
          {:else}
            {@render ipField()}
          {/if}
        {/if}
      </FormSection>

      <Card title={copy.sessionsTitle} flush full>
        {#each sessions as s}
          <div class="session-row">
            <div>
              <p class="session-device">
                {s.device}
                {#if s.current}<Chip label={copy.currentChip} size="sm" variant="brand" />{/if}
              </p>
              <p class="session-meta">{s.ip} · {s.last}</p>
            </div>
            {#if !s.current}
              <Button variant="ghost" size="sm">{copy.revoke}</Button>
            {/if}
          </div>
        {/each}
      </Card>
    {/if}
  {/snippet}
</AppSettings>

<style>

  .member-name   { margin: 0; font-size: 13px; font-weight: 500; color: var(--ca-text-primary); }
  .member-email  { margin: 0; font-size: 11px; color: var(--ca-text-hint); }

  .session-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--ca-outline-subtle);
    gap: 16px;
  }
  .session-row:last-child { border-bottom: none; }

  .session-device {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 2px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ca-text-primary);
  }

  .session-meta {
    margin: 0;
    font-size: 11px;
    color: var(--ca-text-hint);
    font-family: var(--ca-font-mono);
  }
</style>


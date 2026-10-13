<script lang="ts">
  import {
    AppSettings, FormSection, TextField, Select, Switch,
    Button, SettingItem, Divider, Avatar, Row, Chip, GlassCard, SimpleTable,
  } from '@codeatlasdev/ui';
  import { Settings, Bell, Users, Shield, AlertTriangle, Save } from '@lucide/svelte';

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
  const langOpts = [
    { value: 'en', label: 'English'    },
    { value: 'pt', label: 'Portuguese' },
    { value: 'es', label: 'Spanish'    },
    { value: 'fr', label: 'French'     },
  ];
  const roleOpts = [
    { value: 'Admin',  label: 'Admin'  },
    { value: 'Editor', label: 'Editor' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  const TABS = [
    { value: 'general',       label: 'General',        icon: Settings },
    { value: 'notifications', label: 'Notifications', icon: Bell     },
    { value: 'members',       label: 'Members',      icon: Users, badge: members.length },
    { value: 'security',      label: 'Security',    icon: Shield   },
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
    <!-- GERAL -->
    {#if tab === 'general'}
      <FormSection title="Workspace" description="Basic information about your workspace.">
        <TextField label="Workspace name" bind:value={workspaceName} />
        <TextField
          label="URL slug"
          bind:value={workspaceSlug}
          description="app.codeatlas.dev/{workspaceSlug}"
        />
        <Select label="Time zone" bind:value={timezone} options={tzOpts} />
        <Select label="Language"       bind:value={language} options={langOpts} />
      </FormSection>

      <FormSection title="Danger zone" description="Irreversible actions." layout="list">
        <SettingItem
          label="Delete workspace"
          description="Permanently deletes this workspace and all of its data."
        >
          <Button variant="outlined" size="sm" class="ca-btn-danger">
            {#snippet leading()}<AlertTriangle size={14} />{/snippet}
            Delete
          </Button>
        </SettingItem>
      </FormSection>
    {/if}

    <!-- NOTIFICATIONS -->
    {#if tab === 'notifications'}
      <FormSection title="Email" description="Which events send you an email." layout="list">
        <SettingItem label="New user signed up" description="Email on every new registration.">
          <Switch bind:checked={emailOnSignup} />
        </SettingItem>
        <Divider />
        <SettingItem label="Payment events" description="Charges, failures and refunds.">
          <Switch bind:checked={emailOnPayment} />
        </SettingItem>
        <Divider />
        <SettingItem label="System errors" description="Critical errors and downtime alerts.">
          <Switch bind:checked={emailOnError} />
        </SettingItem>
      </FormSection>

      <FormSection title="Push & In-App" description="Real-time notifications inside the platform." layout="list">
        <SettingItem label="Deploy notifications" description="When a deploy finishes or fails.">
          <Switch bind:checked={pushOnDeploy} />
        </SettingItem>
        <Divider />
        <SettingItem label="Performance alerts" description="CPU, memory and disk.">
          <Switch bind:checked={pushOnAlert} />
        </SettingItem>
        <Divider />
        <SettingItem label="Weekly digest" description="Key metrics every Monday.">
          <Switch bind:checked={weeklyDigest} />
        </SettingItem>
      </FormSection>
    {/if}

    <!-- MEMBROS -->
    {#if tab === 'members'}
      <GlassCard flush full>
        {#snippet headerActions()}
          <Button variant="filled" size="sm">Convidar membro</Button>
        {/snippet}
        <SimpleTable>
          <thead>
            <tr><th>Member</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {#each members as m}
              <tr>
                <td>
                  <Row gap={10} align="center">
                    <Avatar alt={m.name} size="sm" />
                    <div>
                      <p class="member-name">{m.name}</p>
                      <p class="member-email">{m.email}</p>
                    </div>
                  </Row>
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
      </GlassCard>
    {/if}

    <!-- SECURITY -->
    {#if tab === 'security'}
      <FormSection title="Authentication" description="Control how members sign in." layout="list">
        <SettingItem label="Two-factor authentication" description="Require 2FA for all members.">
          <Switch bind:checked={mfa} />
        </SettingItem>
        <Divider />
        <SettingItem label="Single sign-on (SSO)" description="Login via provedor SAML ou OIDC.">
          <Switch bind:checked={ssoEnabled} />
        </SettingItem>
      </FormSection>

      <FormSection title="Controle de acesso" description="Restrinja o acesso por IP." layout="list">
        <SettingItem label="IP allow list" description="Only allow access from specific ranges.">
          <Switch bind:checked={ipAllow} />
        </SettingItem>
        {#if ipAllow}
          <Divider />
          <div class="ip-reveal">
            <TextField
              label="Ranges permitidos"
              bind:value={ipRange}
              placeholder="192.168.1.0/24, 10.0.0.1"
              description="Comma-separated CIDRs."
            />
          </div>
        {/if}
      </FormSection>

      <GlassCard title="Active sessions" flush full>
        {#each [
          { device: 'Chrome no macOS',  ip: '192.168.1.42',  last: 'Agora',         current: true  },
          { device: 'Safari on iPhone', ip: '192.168.1.100', last: '2 hr ago',    current: false },
          { device: 'Firefox no Linux', ip: '10.0.0.55',     last: '20 Set, 09:11', current: false },
        ] as s}
          <div class="session-row">
            <div>
              <p class="session-device">
                {s.device}
                {#if s.current}<Chip label="atual" size="sm" variant="brand" />{/if}
              </p>
              <p class="session-meta">{s.ip} · {s.last}</p>
            </div>
            {#if !s.current}
              <Button variant="ghost" size="sm">Revogar</Button>
            {/if}
          </div>
        {/each}
      </GlassCard>
    {/if}
  {/snippet}
</AppSettings>

<style>
  .ip-reveal { padding-top: 12px; }

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

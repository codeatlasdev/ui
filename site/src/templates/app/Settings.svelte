<script lang="ts">
  import {
    AppSettings, FormSection, TextField, Select, Switch,
    Button, SettingItem, Divider, Avatar, Flex, Chip, Card, SimpleTable,
  } from '@codeatlasdev/ui';
  import {
    Settings, Bell, Users, Shield, AlertTriangle, Save,
  } from '@lucide/svelte';

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
        <Select label="Timezone" bind:value={timezone} options={tzOpts} />
        <Select label="Language" bind:value={language} options={langOpts} />
      </FormSection>

      <FormSection title="Danger Zone" description="Irreversible actions. Proceed with caution.">
        <SettingItem
          label="Delete workspace"
          description="Permanently delete this workspace and all its data."
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
      <FormSection title="Email" description="Choose which events trigger an email to you.">
        <SettingItem label="New user signed up" description="Email on every new registration.">
          <Switch bind:checked={emailOnSignup} />
        </SettingItem>
        <Divider />
        <SettingItem label="Payment events" description="Charges, failures, and refunds.">
          <Switch bind:checked={emailOnPayment} />
        </SettingItem>
        <Divider />
        <SettingItem label="System errors" description="Critical errors and downtime alerts.">
          <Switch bind:checked={emailOnError} />
        </SettingItem>
      </FormSection>

      <FormSection title="Push & In-App" description="Real-time notifications inside the platform.">
        <SettingItem label="Deployment notifications" description="When a deployment completes or fails.">
          <Switch bind:checked={pushOnDeploy} />
        </SettingItem>
        <Divider />
        <SettingItem label="Performance alerts" description="CPU, memory, and disk warnings.">
          <Switch bind:checked={pushOnAlert} />
        </SettingItem>
        <Divider />
        <SettingItem label="Weekly digest" description="Summary of key metrics every Monday.">
          <Switch bind:checked={weeklyDigest} />
        </SettingItem>
      </FormSection>
    {/if}

    <!-- ── Members ──────────────────────────────────────────────── -->
    {#if tab === 'members'}
      <Card material="glass" flush full>
        {#snippet headerActions()}
          <Button variant="filled" size="sm">Invite member</Button>
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
      <FormSection title="Authentication" description="Control how members sign in.">
        <SettingItem label="Two-factor authentication" description="Require 2FA for all workspace members.">
          <Switch bind:checked={mfa} />
        </SettingItem>
        <Divider />
        <SettingItem label="Single sign-on (SSO)" description="Allow login via SAML or OIDC provider.">
          <Switch bind:checked={ssoEnabled} />
        </SettingItem>
      </FormSection>

      <FormSection title="Access Control" description="Restrict access by IP.">
        <SettingItem label="IP allowlist" description="Only allow access from specific IP ranges.">
          <Switch bind:checked={ipAllow} />
        </SettingItem>
        {#if ipAllow}
          <Divider />
          <TextField
            label="Allowed IP ranges"
            bind:value={ipRange}
            placeholder="192.168.1.0/24, 10.0.0.1"
            description="Comma-separated CIDR ranges."
          />
        {/if}
      </FormSection>

      <Card material="glass" title="Active Sessions" flush full>
        {#each [
          { device: 'Chrome on macOS',  ip: '192.168.1.42',  last: 'Now',           current: true  },
          { device: 'Safari on iPhone', ip: '192.168.1.100', last: '2 hr ago',       current: false },
          { device: 'Firefox on Linux', ip: '10.0.0.55',     last: 'Sep 20, 09:11',  current: false },
        ] as s}
          <div class="session-row">
            <div>
              <p class="session-device">
                {s.device}
                {#if s.current}<Chip label="current" size="sm" variant="brand" />{/if}
              </p>
              <p class="session-meta">{s.ip} · {s.last}</p>
            </div>
            {#if !s.current}
              <Button variant="ghost" size="sm">Revoke</Button>
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


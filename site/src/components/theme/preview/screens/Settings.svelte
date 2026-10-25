<script lang="ts">
  import {
    Button, Card, Divider, FormSection, Heading, SegmentedControl, Select, SettingItem,
    Slider, Switch, TextField,
  } from '@codeatlasdev/ui';
  import { AlertTriangle, Save } from '@lucide/svelte';

  let name = $state('CodeAtlas Inc.');
  let slug = $state('codeatlas');
  let timezone = $state('america-sao-paulo');
  let theme = $state('system');
  let density = $state(60);
  let digest = $state(true);
  let alerts = $state(true);
  let mfa = $state(false);

  const zones = [
    { value: 'america-sao-paulo', label: 'America/Sao_Paulo (UTC-3)' },
    { value: 'america-new-york', label: 'America/New_York (UTC-4)' },
    { value: 'europe-london', label: 'Europe/London (UTC+1)' },
  ];
  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
</script>

<section class="ts-settings" aria-label="Settings preview">
  <header class="ts-settings__head">
    <div>
      <Heading level={2} size="h3">Settings</Heading>
      <p class="ts-settings__lead">Manage your workspace configuration.</p>
    </div>
    <Button size="sm">
      {#snippet leading()}<Save size={14} />{/snippet}
      Save changes
    </Button>
  </header>

  <FormSection title="Workspace" headingLevel={3} description="Basic information about your workspace.">
    <TextField label="Workspace name" bind:value={name} />
    <TextField label="URL slug" bind:value={slug} description="app.codeatlas.dev/{slug}" />
    <Select label="Timezone" bind:value={timezone} options={zones} />
  </FormSection>

  <FormSection title="Appearance" headingLevel={3} description="How the workspace looks for you." layout="stack">
    <SegmentedControl bind:value={theme} items={themes} aria-label="Color theme" />
    <Slider bind:value={density} min={0} max={100} step={10} label="Interface density" />
  </FormSection>

  <FormSection title="Notifications" headingLevel={3} layout="list">
    <SettingItem label="Weekly digest" description="A summary of key metrics every Monday.">
      <Switch bind:checked={digest} />
    </SettingItem>
    <Divider />
    <SettingItem label="Performance alerts" description="CPU, memory and disk warnings.">
      <Switch bind:checked={alerts} />
    </SettingItem>
    <Divider />
    <SettingItem label="Two-factor authentication" description="Require 2FA for every member.">
      <Switch bind:checked={mfa} />
    </SettingItem>
  </FormSection>

  <Card tone="error" variant="outlined" title="Danger zone" headingLevel={3}>
    <SettingItem
      label="Delete workspace"
      description="Permanently delete this workspace and all of its data."
    >
      <Button variant="destructive" size="sm">
        {#snippet leading()}<AlertTriangle size={14} />{/snippet}
        Delete
      </Button>
    </SettingItem>
  </Card>
</section>

<style>
  .ts-settings {
    display: grid;
    gap: var(--ca-space-5);
    padding: var(--ca-space-4);
    min-width: 0;
    max-width: 48rem;
    margin-inline: auto;
  }
  .ts-settings__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-3);
    flex-wrap: wrap;
  }
  .ts-settings__lead { margin: var(--ca-space-1) 0 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>

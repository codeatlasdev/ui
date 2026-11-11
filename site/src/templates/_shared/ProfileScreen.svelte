<script lang="ts">
  // "Profile & Settings" form shared by the admin and app templates.
  import {
    AppForm, FormSection, TextField, Select, Switch, Button, Avatar, Divider,
  } from '@codeatlasdev/ui';

  interface Props {
    /** Signed-in user: when given, name and email follow it once mounted (admin). */
    user?: { name: string; email: string } | null;
    /** Initial name and email before (or without) a user (the app template has a fixed one). */
    initial?: { name: string; email: string };
    saveDelay: number;
    copy: {
      profileDescription: string;
      nameLabel: string;
      timezoneLabel: string;
      bioPlaceholder?: string;
      notificationsDescription: string;
    };
  }
  let { user = null, initial = { name: '', email: '' }, saveDelay, copy }: Props = $props();

  let name     = $state(initial.name);
  let email    = $state(initial.email);
  let bio      = $state('Product designer & front-end engineer.');
  let timezone = $state('america-sao-paulo');
  let emailN   = $state(true);
  let pushN    = $state(false);
  let mfa      = $state(false);
  let saving   = $state(false);

  $effect(() => { if (user) { name = user.name; email = user.email; } });

  const tzOpts = [
    { value: 'america-sao-paulo', label: 'America/Sao_Paulo (UTC-3)' },
    { value: 'america-new-york',  label: 'America/New_York (UTC-4)'  },
    { value: 'europe-london',     label: 'Europe/London (UTC+1)'     },
    { value: 'asia-tokyo',        label: 'Asia/Tokyo (UTC+9)'        },
  ];

  function save() { saving = true; setTimeout(() => (saving = false), saveDelay); }
</script>

<AppForm title="Profile & Settings" description="Manage your personal information and preferences.">

  <!-- layout="stack": the first child is the avatar (a composite block) followed by the field grid. -->
  <FormSection title="Your profile" description={copy.profileDescription} layout="stack">
    <div class="ca-avatar-row">
      <Avatar alt={name || '?'} size="lg" />
      <div class="ca-avatar-meta">
        <Button variant="outlined" size="sm">Change avatar</Button>
        <p class="ca-avatar-hint">JPG, GIF or PNG. Max 2MB.</p>
      </div>
    </div>

    <!-- Nested FormSection grid: auto-fill 260px, so fields sit in 2 columns -->
    <FormSection layout="grid">
      <TextField label={copy.nameLabel} bind:value={name} />
      <TextField label="Email" bind:value={email} type="email" />
      <TextField label="Bio" bind:value={bio} placeholder={copy.bioPlaceholder} />
      <Select    label={copy.timezoneLabel} bind:value={timezone} options={tzOpts} />
    </FormSection>
  </FormSection>

  <FormSection title="Notifications" description={copy.notificationsDescription} layout="list">
    <Switch label="Email notifications" bind:checked={emailN} />
    <Divider />
    <Switch label="Push notifications" bind:checked={pushN} />
  </FormSection>

  <FormSection title="Security" description="Protect your account." layout="stack">
    <Switch label="Two-factor authentication" bind:checked={mfa} />
    <Button variant="outlined" size="sm">Change password</Button>
  </FormSection>

  {#snippet footer()}
    <Button variant="ghost">Discard</Button>
    <Button variant="filled" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save changes'}
    </Button>
  {/snippet}
</AppForm>

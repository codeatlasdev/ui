<script lang="ts">
  import {
    AppForm, FormSection, TextField, Select, Switch, Button, Avatar, Divider,
  } from '@codeatlasdev/ui';

  let name        = $state('Ana Lima');
  let email       = $state('ana@acme.com');
  let bio         = $state('Product designer & front-end engineer.');
  let timezone    = $state('america-sao-paulo');
  let emailNotify = $state(true);
  let pushNotify  = $state(false);
  let mfa         = $state(false);
  let saving      = $state(false);

  function save() { saving = true; setTimeout(() => (saving = false), 1200); }

  const tzOpts = [
    { value: 'america-sao-paulo', label: 'America/Sao_Paulo (UTC-3)' },
    { value: 'america-new-york',  label: 'America/New_York (UTC-4)'  },
    { value: 'europe-london',     label: 'Europe/London (UTC+1)'     },
    { value: 'asia-tokyo',        label: 'Asia/Tokyo (UTC+9)'        },
  ];
</script>

<AppForm title="Profile & Settings" description="Manage your personal information and preferences.">

  <!--
    layout="stack" because the first child is the avatar (a composite block)
    followed by the field grid; stack gives each block 16px of breathing room
  -->
  <FormSection title="Your profile" description="How you appear in the platform." layout="stack">
    <div class="ca-avatar-row">
      <Avatar alt={name} size="lg" />
      <div class="ca-avatar-meta">
        <Button variant="outlined" size="sm">Change avatar</Button>
        <p class="ca-avatar-hint">JPG, GIF or PNG. Max 2MB.</p>
      </div>
    </div>

    <!-- Nested FormSection grid: auto-fill 260px, so fields sit in 2 columns -->
    <FormSection layout="grid">
      <TextField label="Full name" bind:value={name} />
      <TextField label="Email"     bind:value={email} type="email" />
      <TextField label="Bio"       bind:value={bio}   placeholder="Tell us about yourself" />
      <Select    label="Timezone"  bind:value={timezone} options={tzOpts} />
    </FormSection>
  </FormSection>

  <FormSection title="Notifications" description="Choose what you're notified about." layout="list">
    <Switch label="Email notifications" bind:checked={emailNotify} />
    <Divider />
    <Switch label="Push notifications"  bind:checked={pushNotify} />
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


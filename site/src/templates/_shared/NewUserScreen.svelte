<script lang="ts">
  // "New user" form shared by the admin and app templates; each passes its routes and the few copy/style differences.
  import { AppForm, FormSection, TextField, Select, Switch, Button } from '@codeatlasdev/ui';

  interface Props {
    /** Where Back and Cancel lead, and where the form goes after saving. */
    usersHref: string;
    /** Delay before the demo "creates" the user and navigates. */
    saveDelay: number;
    notificationsDescription: string;
    notificationsLayout?: 'list';
    cancelVariant: 'outlined' | 'ghost';
  }
  let { usersHref, saveDelay, notificationsDescription, notificationsLayout, cancelVariant }: Props = $props();

  let name   = $state('');
  let email  = $state('');
  let role   = $state('viewer');
  let plan   = $state('free');
  let notify = $state(true);
  let saving = $state(false);

  const roleOpts = [{ value: 'admin', label: 'Admin' }, { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }];
  const planOpts = [{ value: 'free',  label: 'Free'  }, { value: 'pro',    label: 'Pro'    }, { value: 'team',   label: 'Team'   }];

  function save() { saving = true; setTimeout(() => location.assign(usersHref), saveDelay); }
</script>

<AppForm title="New User" description="Fill in the details to create a new user." backHref={usersHref}>
  <FormSection title="Account details" description="Basic information for the new user.">
    <TextField label="Full name"  bind:value={name}  placeholder="Ada Lovelace" />
    <TextField label="Work email" bind:value={email} placeholder="ada@company.com" type="email" />
    <Select    label="Role"       bind:value={role}  options={roleOpts} />
    <Select    label="Plan"       bind:value={plan}  options={planOpts} />
  </FormSection>

  <FormSection title="Notifications" description={notificationsDescription} layout={notificationsLayout}>
    <Switch label="Send welcome email" bind:checked={notify} />
  </FormSection>

  {#snippet footer()}
    <Button variant={cancelVariant} href={usersHref}>Cancel</Button>
    <Button variant="filled" onclick={save} disabled={saving || !name || !email}>
      {saving ? 'Creating…' : 'Create user'}
    </Button>
  {/snippet}
</AppForm>

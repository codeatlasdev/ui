<script lang="ts">
  import { Dialog, Button, TextField, Select, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
  let name = $state('');
  let email = $state('');
  let role = $state('viewer');
  const roleOpts = [
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];
</script>

<Button variant="filled" onclick={() => (open = true)}>Invite member</Button>

<Dialog bind:open title="Invite team member" size="md">
  <Stack gap="3.5">
    <TextField label="Full name" bind:value={name} placeholder="Ada Lovelace" />
    <TextField label="Email" type="email" bind:value={email} placeholder="ada@company.com" />
    <Select label="Role" bind:value={role} options={roleOpts} />
  </Stack>
  {#snippet actions()}
    <Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
    <Button variant="filled" disabled={!name || !email} onclick={() => (open = false)}>Send invite</Button>
  {/snippet}
</Dialog>

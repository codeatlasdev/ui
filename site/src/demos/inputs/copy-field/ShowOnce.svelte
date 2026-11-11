<script lang="ts">
  import { AlertDialog, Button, CopyField } from '@codeatlasdev/ui';

  let open = $state(false);
  let copied = $state(false);
  const secret = 'acme_demo_A1b2C3d4E5F6g7H8i9J0k1L2m3N4o5P6';
</script>

<Button variant="outlined" onclick={() => { copied = false; open = true; }}>Create API key</Button>

<!-- AlertDialog has no X and ignores scrim clicks; Confirm stays off until the key is copied.
     Escape still closes it, so say so in the description. -->
<AlertDialog
  bind:open
  title="Your new API key"
  description="This is the only time the key is shown. Copy it now; Escape closes this dialog and the key is gone."
  confirmLabel="I saved it"
  confirmDisabled={!copied}
  cancelLabel="Close"
  onconfirm={() => {}}
>
  <CopyField label="API key" value={secret} mask copyLabel="Copy key" oncopy={() => (copied = true)} />
</AlertDialog>

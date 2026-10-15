<script lang="ts">
  import { Dialog, Button, TextField, Stack } from '@codeatlasdev/ui';

  let open = $state(false);
  let name = $state('');
  let email = $state('');
</script>

<Button variant="filled" onclick={() => (open = true)}>Open split</Button>

<Dialog bind:open title="Lead details" size="split" chromeless>
  <div class="media">Media / summary</div>
  <div class="form">
    <Stack gap="3.5">
      <TextField label="Full name" bind:value={name} placeholder="Ada Lovelace" />
      <TextField label="Email" type="email" bind:value={email} placeholder="ada@company.com" />
      <Button variant="filled" onclick={() => (open = false)}>Save</Button>
    </Stack>
  </div>
</Dialog>

<style>
  .media {
    display: grid;
    place-items: center;
    min-height: 160px;
    background: color-mix(in oklab, var(--ca-brand-main) 12%, var(--ca-surface-overlay));
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
  .form { padding: 24px; overflow-y: auto; }
</style>

<script lang="ts">
  import { PageShell, Card, TextField, Stack } from '@codeatlasdev/ui';

  let name = $state('Acme Inc.');
  let slug = $state('acme');
</script>

<div class="stage">
  <PageShell title="Workspace settings" description="Reading width keeps the form at a comfortable line length." width="reading" asideLabel="Sections">
    {#snippet aside()}
      <Card material="glass" full>
        <nav class="index" aria-label="On this page">
          <a href="#general">General</a>
          <a href="#billing">Billing</a>
          <a href="#danger">Danger zone</a>
        </nav>
      </Card>
    {/snippet}

    <Card material="glass" full title="General">
      <Stack gap="4">
        <TextField label="Name" bind:value={name} />
        <TextField label="Slug" bind:value={slug} />
      </Stack>
    </Card>
  </PageShell>
</div>

<style>
  .stage {
    --ca-vh: 420px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 420px;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  .index {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
  }
  .index a {
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
    text-decoration: none;
  }
  .index a:hover {
    color: var(--ca-text-primary);
  }
</style>

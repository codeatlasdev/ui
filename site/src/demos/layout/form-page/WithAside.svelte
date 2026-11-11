<script lang="ts">
  import { AppForm, Button, Card, FormSection, Select, Stat, Stepper, TextField } from '@codeatlasdev/ui';

  let name = $state('Acme Inc.');
  let slug = $state('acme');
  let plan = $state('team');

  const planOptions = [
    { value: 'free', label: 'Free' },
    { value: 'team', label: 'Team' },
    { value: 'business', label: 'Business' },
  ];
  const seats = $derived(plan === 'free' ? 3 : plan === 'team' ? 25 : 250);
  const done = $derived((name ? 1 : 0) + (slug ? 1 : 0) + (plan ? 1 : 0));
  const steps = $derived([
    { label: 'Name the workspace', description: name ? 'Done' : 'Required' },
    { label: 'Pick a URL', description: slug ? `app.example.com/${slug}` : 'Required' },
    { label: 'Choose a plan', description: planOptions.find((o) => o.value === plan)?.label },
  ]);
</script>

<div class="frame">
  <AppForm title="Workspace" description="Name, address and plan." asideLabel="Preview and help">
    <FormSection title="General" description="How the workspace appears to your team.">
      <TextField label="Name" bind:value={name} />
      <TextField label="Address" bind:value={slug} />
      <Select label="Plan" bind:value={plan} options={planOptions} />
    </FormSection>

    {#snippet aside()}
      <Card title="Preview" headingLevel={2}>
        <strong>{name || 'Untitled'}</strong>
        <p class="muted">app.example.com/{slug || '…'}</p>
      </Card>
      <Card title="Plan" headingLevel={2}>
        <Stat label="Seats included" value={seats} size="sm" />
      </Card>
      <Card title="Checklist" headingLevel={2}>
        <Stepper {steps} current={Math.min(done, steps.length - 1)} />
      </Card>
    {/snippet}

    {#snippet footer()}
      <Button variant="ghost">Cancel</Button>
      <Button variant="filled">Save</Button>
    {/snippet}
  </AppForm>
</div>

<style>
  .frame {
    width: 100%;
    height: 560px;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .muted {
    margin: var(--ca-space-1) 0 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>

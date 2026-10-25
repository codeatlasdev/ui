<script lang="ts">
  import {
    Button, Checkbox, DateField, FormSection, Heading, RadioGroup, Select, StickyActions,
    TextArea, TextField,
  } from '@codeatlasdev/ui';
  import type { DateValue } from '@codeatlasdev/ui';

  let title = $state('Q4 launch review');
  let email = $state('ana@acme');
  let team = $state('design');
  let due = $state<DateValue | undefined>(undefined);
  let priority = $state('normal');
  let notes = $state('');
  let notify = $state(true);
  let terms = $state(false);

  const teams = [
    { value: 'design', label: 'Design' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'support', label: 'Support' },
  ];
  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal', description: 'Reviewed within the week.' },
    { value: 'high', label: 'High', description: 'Reviewed within a day.' },
  ];

  // The error state is always visible so every theme change shows it.
  const emailError = $derived(email.includes('@') && email.split('@')[1]?.includes('.') ? undefined : 'Enter a full address, like ana@acme.com.');
</script>

<section class="ts-form" aria-label="Form preview">
  <header class="ts-form__head">
    <Heading level={2} size="h3">New review request</Heading>
    <p class="ts-form__lead">Fields marked required must be filled before you can send.</p>
  </header>

  <form class="ts-form__body" onsubmit={(e) => e.preventDefault()} novalidate>
    <FormSection title="Details" headingLevel={3}>
      <TextField label="Title" bind:value={title} required />
      <TextField label="Requester email" type="email" bind:value={email} error={emailError} required />
      <Select label="Team" bind:value={team} options={teams} />
      <DateField label="Due date" bind:value={due} description="Optional." />
    </FormSection>

    <FormSection title="Priority" headingLevel={3} layout="stack">
      <RadioGroup bind:value={priority} items={priorities} variant="cards" aria-label="Priority" />
    </FormSection>

    <FormSection title="Context" headingLevel={3} layout="stack">
      <TextArea label="Notes" bind:value={notes} placeholder="Links, constraints, who to ask." rows={3} />
      <Checkbox bind:checked={notify} label="Email me when the review is done" />
      <Checkbox bind:checked={terms} label="I have read the review guidelines" />
    </FormSection>

    <StickyActions>
      <Button variant="ghost" type="button">Cancel</Button>
      <Button variant="outlined" type="button">Save draft</Button>
      <Button type="submit" disabled={!terms}>Send request</Button>
    </StickyActions>
  </form>
</section>

<style>
  .ts-form {
    display: grid;
    gap: var(--ca-space-4);
    padding: var(--ca-space-4);
    min-width: 0;
    max-width: 44rem;
    margin-inline: auto;
  }
  .ts-form__head { display: grid; gap: var(--ca-space-1); }
  .ts-form__lead { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .ts-form__body { display: grid; gap: var(--ca-space-5); min-width: 0; }
</style>

<script lang="ts">
  import AppForm from '../AppForm/AppForm.svelte';
  import AppSettings from '../AppSettings/AppSettings.svelte';
  import EmptyState from '../EmptyState/EmptyState.svelte';
  import FormSection from './FormSection.svelte';

  let { page, headingLevel }: { page: 'settings' | 'form'; headingLevel?: 2 | 3 | 4 | 5 | 6 } = $props();
  const tabs = [{ value: 'general', label: 'General' }];
</script>

<main>
  {#if page === 'settings'}
    <AppSettings title="Settings" {tabs}>
      <FormSection title="Theme" description="Pick one" {headingLevel}>Body</FormSection>
      <EmptyState title="Nothing here" />
    </AppSettings>
  {:else}
    <AppForm title="New user">
      <FormSection title="Account" {headingLevel}>Body</FormSection>
    </AppForm>
  {/if}
</main>

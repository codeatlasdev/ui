<script lang="ts">
  import { LocaleSwitcher } from '@codeatlasdev/ui';

  const options = [
    { value: 'pt-BR', label: 'Português', short: 'PT' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  let locale = $state('pt-BR');
  let saved = $state('');

  // Save the preference, set the cookie, then navigate to the localized URL.
  async function onselect(next: string) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    saved = `Saved ${next}; the app would now go to /${next}/login.`;
  }
</script>

<div class="col">
  <LocaleSwitcher {options} bind:value={locale} {onselect} />
  <p class="note">{saved || 'Pick a language: the switcher stays busy until onselect resolves.'}</p>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ca-space-3);
  }
  .note {
    margin: 0;
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-body2);
  }
</style>

<script lang="ts">
  import { Button, Card, LocaleSwitcher, SiteHeader } from '@codeatlasdev/ui';

  const options = [
    { value: 'pt-BR', label: 'Português', short: 'PT' },
    { value: 'en', label: 'English' },
  ];
  let locale = $state('pt-BR');
</script>

<Card material="glass" full flush>
  <SiteHeader>
    {#snippet trailing()}
      <LocaleSwitcher {options} bind:value={locale} />
      <Button size="sm" variant="filled">Sign up</Button>
    {/snippet}
  </SiteHeader>
</Card>

<script lang="ts">
  import { ChipGroup, TextField } from '@codeatlasdev/ui';

  let size = $state('2-5');
  let site = $state('acme');
  let password = $state('');

  const sizes = [
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2 to 5' },
    { value: '6-20', label: '6 to 20' },
    { value: '21-50', label: '21 to 50' },
    { value: '50+', label: '50+' },
  ];
</script>

<div class="col">
  <ChipGroup label="Sales team size" items={sizes} bind:value={size} />
  <TextField label="Website" prefix="https://" suffix=".com" bind:value={site} description="Read with the label: https:// acme .com" />
  <TextField
    label="Password"
    type="password"
    revealable
    required
    requiredIndicator={false}
    autocomplete="new-password"
    bind:value={password}
  >
    {#snippet below()}
      <a class="link" href="#forgot-password">Forgot password?</a>
    {/snippet}
  </TextField>
</div>

<style>
  .col { display: grid; gap: var(--ca-space-5); width: 100%; max-width: 26rem; }
  .link { color: var(--ca-brand-text); }
</style>

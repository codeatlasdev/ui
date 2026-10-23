<script lang="ts">
  import { PasswordStrength, TextField } from '@codeatlasdev/ui';

  let password = $state('');
  // Your own rule: 12+ characters is strong, 8+ fair. Return 0 (empty) to 3 (strong).
  const byLength = (v: string) => (v.length === 0 ? 0 : v.length >= 12 ? 3 : v.length >= 8 ? 2 : 1);
</script>

<div class="col">
  <TextField label="Passphrase" type="password" bind:value={password} />
  <PasswordStrength
    value={password}
    score={byLength}
    labels={{ empty: 'Type a passphrase', weak: 'Too short', fair: 'Almost there', strong: 'Good length' }}
  />
</div>

<style>
  .col { display: grid; gap: var(--ca-space-2); width: 100%; max-width: 20rem; }
</style>

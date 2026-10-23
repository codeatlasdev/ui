<script lang="ts">
  import { PasswordStrength, TextField } from '@codeatlasdev/ui';

  let password = $state('');
</script>

<div class="col">
  <TextField label="Password" type="password" bind:value={password} />
  <PasswordStrength value={password} />
</div>

<style>
  .col { display: grid; gap: var(--ca-space-2); width: 100%; max-width: 20rem; }
</style>

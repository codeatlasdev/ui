<script lang="ts">
  import { TextField } from '@codeatlasdev/ui';

  let email = $state('');
  let password = $state('');
</script>

<div class="col">
  <TextField label="Email" type="email" autocomplete="email" required requiredIndicator={false} bind:value={email} />
  <TextField
    label="Password"
    type="password"
    revealable
    required
    requiredIndicator={false}
    autocomplete="current-password"
    bind:value={password}
  >
    {#snippet below()}
      <a href="/forgot-password">Forgot password?</a>
    {/snippet}
  </TextField>
</div>

<style>
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4);
    width: 100%;
    max-width: 400px;
  }
</style>

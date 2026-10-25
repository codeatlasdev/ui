<script lang="ts">
  import { Button, Card, Checkbox, Divider, Heading, Stack, TextField } from '@codeatlasdev/ui';
  import { KeyRound, Mail } from '@lucide/svelte';

  let email = $state('');
  let password = $state('');
  let remember = $state(true);
</script>

<section class="ts-auth" aria-label="Sign in preview">
  <Card padding="lg" class="ts-auth__card">
    <Stack gap="4">
      <div class="ts-auth__head">
        <Heading level={2} size="h3">Welcome back</Heading>
        <p class="ts-auth__lead">Sign in to your account to continue.</p>
      </div>

      <form class="ts-auth__form" onsubmit={(e) => e.preventDefault()}>
        <Stack gap="3">
          <TextField
            label="Email address"
            type="email"
            bind:value={email}
            placeholder="you@example.com"
            autocomplete="email"
          />
          <TextField
            label="Password"
            type="password"
            revealable
            bind:value={password}
            placeholder="At least 8 characters"
            autocomplete="current-password"
          />
          <div class="ts-auth__meta">
            <Checkbox bind:checked={remember} label="Remember me" />
            <a href="#forgot" class="ts-auth__link">Forgot password?</a>
          </div>
          <Button type="submit" fullWidth>Sign in</Button>
        </Stack>
      </form>

      <div class="ts-auth__or" role="separator" aria-label="or">
        <Divider />
        <span aria-hidden="true">or</span>
        <Divider />
      </div>

      <Stack gap="2">
        <Button variant="outlined" fullWidth>
          {#snippet leading()}<Mail size={16} />{/snippet}
          Continue with email link
        </Button>
        <Button variant="outlined" fullWidth>
          {#snippet leading()}<KeyRound size={16} />{/snippet}
          Continue with a passkey
        </Button>
      </Stack>

      <p class="ts-auth__foot">
        New here? <a href="#signup" class="ts-auth__link">Create an account</a>
      </p>
    </Stack>
  </Card>
</section>

<style>
  .ts-auth {
    display: grid;
    place-items: center;
    padding: var(--ca-space-6) var(--ca-space-4);
    min-width: 0;
  }
  .ts-auth :global(.ts-auth__card) { width: 100%; max-width: 26rem; }
  .ts-auth__head { display: grid; gap: var(--ca-space-1); }
  .ts-auth__lead { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .ts-auth__form { margin: 0; }
  .ts-auth__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ca-space-2); }
  .ts-auth__or {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--ca-space-3);
    color: var(--ca-text-secondary);
    font-size: var(--ca-font-size-caption);
  }
  .ts-auth__link { color: var(--ca-brand-text, var(--ca-brand-fill)); font-weight: var(--ca-font-weight-medium); }
  .ts-auth__foot { margin: 0; text-align: center; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
</style>

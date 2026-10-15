<script lang="ts">
  import { AuthLayout, AuthCard, TextField, Button, Stack } from '@codeatlasdev/ui';

  let name    = $state('');
  let email   = $state('');
  let pass    = $state('');
  let loading = $state(false);

  function submit(e: Event) {
    e.preventDefault();
    loading = true;
    setTimeout(() => (loading = false), 1400);
  }
</script>

<AuthLayout>
  {#snippet panel()}
    <ol class="auth-steps">
      <li class="auth-step auth-step--done">
        <span class="auth-step__num">1</span>
        <span>Create account</span>
      </li>
      <li class="auth-step auth-step--active">
        <span class="auth-step__num">2</span>
        <span>Set up workspace</span>
      </li>
      <li class="auth-step">
        <span class="auth-step__num">3</span>
        <span>Invite your team</span>
      </li>
    </ol>
  {/snippet}

  <AuthCard title="Create your account" subtitle="Start building in minutes. No credit card required.">
    <form onsubmit={submit}>
      <Stack gap="3.5">
        <TextField label="Full name" bind:value={name}
          placeholder="Ada Lovelace" autocomplete="name" />
        <TextField label="Work email" type="email" bind:value={email}
          placeholder="ada@company.com" autocomplete="email" />
        <TextField label="Password" type="password" bind:value={pass}
          placeholder="Min. 8 characters" autocomplete="new-password" />
        <Button type="submit" variant="filled" fullWidth
          disabled={loading || !name || !email || !pass}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </Stack>
    </form>
    {#snippet footer()}
      <span class="auth-terms">
        By creating an account you agree to our
        <span class="auth-link">Terms</span> and
        <span class="auth-link">Privacy Policy</span>.
      </span>
      <span>Already have an account? <a href="/templates/auth/sign-in/" class="auth-link">Sign in</a></span>
    {/snippet}
  </AuthCard>
</AuthLayout>

<style>
  /* Steps use the dark panel vars defined by AuthLayout */
  .auth-steps {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 16px;
  }
  .auth-step {
    display: flex; align-items: center; gap: 12px;
    font-size: 14px; font-weight: 500;
    color: var(--panel-text-tertiary);
  }
  .auth-step--done   { color: var(--panel-text-secondary); }
  .auth-step--active { color: var(--panel-text-primary); }

  .auth-step__num {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
    border: 1.5px solid var(--panel-border);
    background: var(--panel-surface);
    color: inherit;
  }
  .auth-step--active .auth-step__num {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
    border-color: transparent;
  }

  .auth-terms { display: block; font-size: 12px; color: var(--ca-text-hint); }
</style>

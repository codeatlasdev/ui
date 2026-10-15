<script lang="ts">
  import { AuthLayout, AuthCard, TextField, Button, Stack } from '@codeatlasdev/ui';
  import { Mail } from '@lucide/svelte';

  let email   = $state('');
  let sent    = $state(false);
  let loading = $state(false);

  function submit(e: Event) {
    e.preventDefault();
    loading = true;
    setTimeout(() => { loading = false; sent = true; }, 1200);
  }
</script>

<AuthLayout>
  {#snippet panel()}
    <blockquote class="auth-quote">
      <p class="auth-quote__text">"Security is not a product,<br/>but a process."</p>
      <footer class="auth-quote__attr">— Bruce Schneier</footer>
    </blockquote>
  {/snippet}

  {#if sent}
    <AuthCard>
      <Stack gap="4" align="center">
        <div class="success-icon" aria-hidden="true"><Mail size={24} /></div>
        <Stack gap="1.5" align="center">
          <h1 class="sent-title">Check your email</h1>
          <p class="sent-sub">We sent a reset link to <strong>{email}</strong></p>
        </Stack>
        <a href="/templates/auth/sign-in/" class="auth-link">← Back to Sign in</a>
      </Stack>
    </AuthCard>
  {:else}
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send a reset link.">
      <form onsubmit={submit}>
        <Stack gap="3.5">
          <TextField label="Email address" type="email" bind:value={email}
            placeholder="you@example.com" autocomplete="email" />
          <Button type="submit" variant="filled" fullWidth disabled={loading || !email}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </Stack>
      </form>
      {#snippet footer()}
        <a href="/templates/auth/sign-in/" class="auth-link">← Back to Sign in</a>
      {/snippet}
    </AuthCard>
  {/if}
</AuthLayout>

<style>
  .auth-quote { margin: 0; max-width: 380px; }
  .auth-quote__text {
    font-size: 22px; line-height: 1.4; font-weight: 500;
    letter-spacing: -0.01em; margin: 0;
    color: var(--panel-text-primary);
  }
  .auth-quote__attr {
    font-size: 13px; margin-top: 16px;
    color: var(--panel-text-secondary);
  }

  .success-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: color-mix(in oklch, var(--ca-brand-main) 12%, transparent);
    color: var(--ca-brand-text);
    display: flex; align-items: center; justify-content: center;
  }
  .sent-title { font-size: 20px; font-weight: 600; color: var(--ca-text-primary); margin: 0; }
  .sent-sub   { font-size: 14px; color: var(--ca-text-secondary); margin: 0; text-align: center; }
</style>

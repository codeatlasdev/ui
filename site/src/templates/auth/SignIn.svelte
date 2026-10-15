<script lang="ts">
  import { AuthLayout, AuthCard, TextField, Button, Stack, Flex } from '@codeatlasdev/ui';
  import { Eye, EyeOff } from '@lucide/svelte';

  let email    = $state('');
  let password = $state('');
  let showPass = $state(false);
  let loading  = $state(false);

  function submit(e: Event) {
    e.preventDefault();
    loading = true;
    setTimeout(() => (loading = false), 1600);
  }
</script>

<AuthLayout>
  {#snippet panel()}
    <blockquote class="auth-quote">
      <p class="auth-quote__text">"The interface is the product.<br/>Make every pixel count."</p>
      <footer class="auth-quote__attr">— Design System Manifesto</footer>
    </blockquote>
  {/snippet}

  <AuthCard title="Welcome back" subtitle="Sign in to your account to continue">
    <form onsubmit={submit}>
      <Stack gap="3.5">
        <TextField label="Email address" type="email" bind:value={email}
          placeholder="you@example.com" autocomplete="email" />
        <TextField label="Password" type={showPass ? 'text' : 'password'}
          bind:value={password} placeholder="Min. 8 characters" autocomplete="current-password">
          {#snippet trailing()}
            <button type="button" class="pass-btn"
              onclick={() => (showPass = !showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {#if showPass}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
            </button>
          {/snippet}
        </TextField>
        <Flex justify="end">
          <a href="/templates/auth/forgot-password/" class="auth-link auth-link--sm">Forgot password?</a>
        </Flex>
        <Button type="submit" variant="filled" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </form>

    <div class="auth-or"><span>OR</span></div>

    <Stack gap="2">
      <Button variant="outlined" fullWidth>
        {#snippet leading()}
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        {/snippet}
        Continue with Google
      </Button>
      <Button variant="outlined" fullWidth>
        {#snippet leading()}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .269.18.579.688.481C19.138 20.194 22 16.44 22 12.017 22 6.484 17.523 2 12 2z"/>
          </svg>
        {/snippet}
        Continue with GitHub
      </Button>
    </Stack>

    {#snippet footer()}
      Don't have an account? <a href="/templates/auth/sign-up/" class="auth-link">Create one</a>
    {/snippet}
  </AuthCard>
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
</style>

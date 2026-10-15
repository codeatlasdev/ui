<script lang="ts">
  import { AuthLayout, AuthCard, TextField, Button, Stack } from '@codeatlasdev/ui';
  import { Eye, EyeOff } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { DEMO_EMAIL, DEMO_PASSWORD, getUser, login } from '../_shared/auth';

  const DASHBOARD = '/templates/admin/dashboard/';

  let email    = $state(DEMO_EMAIL);
  let password = $state('');
  let showPass = $state(false);
  let error    = $state('');
  let loading  = $state(false);

  onMount(() => {
    if (getUser()) location.replace(DASHBOARD);
  });

  function submit(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;
    setTimeout(() => {
      if (login(email, password)) location.assign(DASHBOARD);
      else {
        error = 'Invalid email or password.';
        loading = false;
      }
    }, 600);
  }
</script>

<AuthLayout logoMark="CA" logoName="CodeAtlas UI" logoHref="/templates/">
  {#snippet panel()}
    <div class="panel-copy">
      <h2 class="panel-copy__title">The glass-first<br />design system</h2>
      <p class="panel-copy__sub">Built for Svelte 5. Every surface, token, and component aligned to one cohesive system.</p>
    </div>
    <div class="panel-hint">
      <p class="panel-hint__label">Demo credentials</p>
      <code class="panel-hint__code">{DEMO_EMAIL}</code>
      <code class="panel-hint__code">{DEMO_PASSWORD}</code>
    </div>
  {/snippet}

  <AuthCard title="Welcome back" subtitle="Sign in to the admin demo">
    <form onsubmit={submit}>
      <Stack gap="3.5">
        <TextField label="Email" type="email" bind:value={email} autocomplete="email" />
        <TextField label="Password" type={showPass ? 'text' : 'password'}
          bind:value={password} placeholder={DEMO_PASSWORD} autocomplete="current-password">
          {#snippet trailing()}
            <button type="button" class="pass-btn"
              onclick={() => (showPass = !showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {#if showPass}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
            </button>
          {/snippet}
        </TextField>
        {#if error}<p class="auth-error" role="alert">{error}</p>{/if}
        <Button type="submit" variant="filled" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
    </form>
    {#snippet footer()}
      <a href="/templates/" class="auth-link auth-link--muted">← Back to templates</a>
    {/snippet}
  </AuthCard>
</AuthLayout>

<style>
  .panel-copy__title {
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin: 0 0 10px;
    color: var(--panel-text-primary);
  }
  .panel-copy__sub {
    font-size: 15px;
    line-height: 1.6;
    color: var(--panel-text-secondary);
    margin: 0;
  }
  .panel-hint__label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--panel-text-tertiary);
    margin: 0 0 8px;
  }
  .panel-hint__code {
    display: block;
    font-family: var(--ca-font-mono);
    font-size: 13px;
    color: var(--panel-text-primary);
    background: var(--panel-surface);
    border: 1px solid var(--panel-border);
    padding: 4px 10px;
    border-radius: 6px;
    margin-top: 4px;
  }
  .auth-link--muted { font-size: 13px; color: var(--ca-text-secondary); text-decoration: none; }
  .auth-link--muted:hover { color: var(--ca-brand-text); }
</style>

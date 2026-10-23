<script lang="ts">
  import { Button, Stack, TextField } from '@codeatlasdev/ui';
  import { Turnstile, type TurnstileHandle } from '@codeatlasdev/ui/forms';

  // Cloudflare's public test key: always passes. Use your own site key in production.
  const SITE_KEY = '1x00000000000000000000AA';

  let handle = $state<TurnstileHandle>();
  let email = $state('');
  let status = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const token = handle?.getToken();
    if (!token) {
      status = 'Complete the security check first.';
      return;
    }
    // POST { email, token } and verify the token on your server. A token is single-use:
    // after a failed submit start a new challenge.
    status = `Sending with a ${token.length}-character token…`;
    handle?.reset();
  }
</script>

<form onsubmit={submit}>
  <Stack gap="3">
    <TextField label="Email" type="email" bind:value={email} />
    <Turnstile siteKey={SITE_KEY} action="sign-in" bind:handle />
    <Button type="submit" fullWidth>Sign in</Button>
    <p class="status" role="status">{status}</p>
  </Stack>
</form>

<style>
  form { width: 100%; max-width: 20rem; }
  .status { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>

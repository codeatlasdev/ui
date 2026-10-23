<script lang="ts">
  import { AuthLayout, AuthCard, TextField, Button, Stack } from '@codeatlasdev/ui';

  let email   = $state('');
  let loading = $state(false);

  function submit(e: Event) {
    e.preventDefault();
    loading = true;
    setTimeout(() => (loading = false), 1400);
  }

  const pins = [
    { x: 22, y: 38 },
    { x: 48, y: 30 },
    { x: 63, y: 56 },
    { x: 34, y: 66 },
    { x: 78, y: 34 },
  ];
</script>

<AuthLayout panelSide="right" panelBleed panelHidden="lg" align="start">
  {#snippet header()}
    <a href="/" class="map-brand">Atlas</a>
    <Button variant="outlined" size="sm" href="/templates/auth/sign-up/">Create account</Button>
  {/snippet}

  {#snippet panel()}
    <div class="map" role="img" aria-label="Map with pins for active locations">
      {#each pins as pin}
        <span class="map__pin" style="--x:{pin.x}%;--y:{pin.y}%"></span>
      {/each}
      <p class="map__queue"><strong>1,284</strong> people ahead of you</p>
    </div>
  {/snippet}

  <AuthCard variant="plain" title="Join the waitlist" subtitle="We open a few spots every week.">
    <form onsubmit={submit}>
      <Stack gap="3.5">
        <TextField label="Email address" type="email" bind:value={email}
          placeholder="you@example.com" autocomplete="email" required />
        <Button type="submit" variant="filled" fullWidth disabled={loading}>
          {loading ? 'Saving…' : 'Request access'}
        </Button>
      </Stack>
    </form>
    {#snippet footer()}
      Already invited? <a href="/templates/auth/sign-in/">Sign in</a>
    {/snippet}
  </AuthCard>
</AuthLayout>

<style>
  .map-brand {
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-lg);
    font-weight: var(--ca-font-weight-heading);
    color: var(--ca-text-primary);
    text-decoration: none;
  }
  .map {
    position: relative;
    isolation: isolate;
    background:
      radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--ca-brand-main) 45%, transparent), transparent 60%),
      linear-gradient(145deg, color-mix(in oklab, var(--ca-brand-main) 40%, oklch(0.12 0 0)), oklch(0.09 0 0));
  }
  .map::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, oklch(0 0 0 / 0.55), transparent 45%);
  }
  .map__pin {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--ca-space-3);
    height: var(--ca-space-3);
    border-radius: 50%;
    background: var(--ca-brand-main);
    box-shadow: 0 0 var(--ca-space-5) var(--ca-space-1) var(--ca-brand-main);
    z-index: 1;
  }
  .map__queue {
    position: absolute;
    z-index: 2;
    left: var(--ca-space-8);
    bottom: var(--ca-space-8);
    margin: 0;
    color: oklch(1 0 0 / 0.92);
    font-size: var(--ca-font-size-body1);
  }
</style>

<script lang="ts">
  import './error.css';
  import { Button, Stack } from '@codeatlasdev/ui';
</script>

<main id="main" class="error-root" tabindex="-1">
  <Stack gap="8" align="center" class="error-inner">
    <div class="error-visual" aria-hidden="true">
      <span class="error-code error-code--danger">500</span>
      <svg
        class="error-illustration"
        viewBox="0 0 200 100"
        fill="none"
        aria-hidden="true"
        color="var(--ca-semantic-error)"
      >
        <ellipse cx="100" cy="90" rx="75" ry="12" fill="currentColor" opacity=".06"/>
        <rect x="60" y="18" width="80" height="56" rx="6" fill="currentColor" opacity=".08"/>
        <rect x="68" y="26" width="64" height="36" rx="3" fill="currentColor" opacity=".10"/>
        <path d="M80 44 L86 38 L92 46 L98 36 L104 44 L110 40 L116 48 L120 44"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>
        <circle cx="74" cy="30" r="3" fill="currentColor" opacity=".3"/>
        <circle cx="82" cy="30" r="3" fill="currentColor" opacity=".3"/>
        <circle cx="90" cy="30" r="3" fill="currentColor" opacity=".3"/>
      </svg>
    </div>

    <Stack gap="3" align="center">
      <h1 class="error-title">Internal server error</h1>
      <p class="error-body">Something went wrong on our end. We're already on it, so please try again shortly.</p>
    </Stack>

    <Stack gap="3" align="center" class="error-actions">
      <Button onclick={() => location.reload()} variant="filled">Try again</Button>
      <Button href="/templates/" variant="outlined">Back to templates</Button>
    </Stack>
  </Stack>
</main>

<style>
  .error-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

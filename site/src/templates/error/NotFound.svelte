<script lang="ts">
  import './error.css';
  import { Button, Stack } from '@codeatlasdev/ui';
</script>

<main id="main" class="error-root" tabindex="-1">
  <Stack gap="8" align="center" class="error-inner">
    <div class="error-visual" aria-hidden="true">
      <span class="error-code error-code--brand">404</span>
      <svg
        class="error-illustration"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        color="var(--ca-brand-main)"
      >
        <ellipse cx="100" cy="100" rx="80" ry="18" fill="currentColor" opacity=".06"/>
        <rect x="70" y="20" width="60" height="72" rx="8" fill="currentColor" opacity=".08"/>
        <rect x="76" y="26" width="48" height="42" rx="4" fill="currentColor" opacity=".12"/>
        <circle cx="100" cy="60" r="14" fill="currentColor" opacity=".15"/>
        <path d="M94 60 L106 60 M100 54 L100 66" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>
        <circle cx="100" cy="76" r="2.5" fill="currentColor" opacity=".5"/>
      </svg>
    </div>

    <Stack gap="3" align="center">
      <h1 class="error-title">Page not found</h1>
      <p class="error-body">Sorry, the page you're looking for doesn't exist or has been moved.</p>
    </Stack>

    <Stack gap="3" align="center" class="error-actions">
      <Button href="/templates/" variant="filled">Back to templates</Button>
      <Button onclick={() => history.back()} variant="outlined">Go back</Button>
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

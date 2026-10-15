<script lang="ts">
  import './error.css';
  import { Button, Stack } from '@codeatlasdev/ui';
  import { onMount, onDestroy } from 'svelte';

  const TARGET = new Date(Date.now() + 4 * 60 * 60 * 1000);

  let remaining = $state({ h: 4, m: 0, s: 0 });
  let timer: ReturnType<typeof setInterval>;

  onMount(() => {
    timer = setInterval(() => {
      const diff = Math.max(0, TARGET.getTime() - Date.now());
      remaining = {
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      };
    }, 1000);
  });

  onDestroy(() => clearInterval(timer));

  const pad = (n: number) => String(n).padStart(2, '0');

  const units = $derived([
    { val: remaining.h, label: 'hours'   },
    { val: remaining.m, label: 'minutes' },
    { val: remaining.s, label: 'seconds' },
  ]);
</script>

<main id="main" class="error-root" tabindex="-1">
  <Stack gap="10" align="center" class="error-inner">
    <div class="maint-icon" aria-hidden="true">
      <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
        <circle cx="40" cy="40" r="38"
          fill="currentColor" fill-opacity=".08"
          stroke="currentColor" stroke-width="1.5" stroke-opacity=".2"/>
        <path d="M50 28a8 8 0 0 0-11.3 11.3L28 50a4 4 0 0 0 5.7 5.7l10.7-10.7A8 8 0 0 0 50 28z"
          fill="currentColor" opacity=".6"/>
        <circle cx="50" cy="30" r="3" fill="currentColor" opacity=".9"/>
      </svg>
    </div>

    <Stack gap="3" align="center">
      <h1 class="error-title">Under maintenance</h1>
      <p class="error-body">We're making improvements. Back in a few hours.</p>
    </Stack>

    <div class="countdown" aria-live="polite" aria-label="Time remaining">
      {#each units as unit, i}
        {#if i > 0}<span class="countdown__sep" aria-hidden="true">:</span>{/if}
        <div class="countdown__tick">
          <span class="countdown__val">{pad(unit.val)}</span>
          <span class="countdown__label">{unit.label}</span>
        </div>
      {/each}
    </div>

    <Button href="mailto:support@example.com" variant="outlined">Contact support</Button>
  </Stack>
</main>

<style>
  .maint-icon {
    color: var(--ca-brand-text);
  }

  .countdown {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }

  .countdown__sep {
    font-size: 36px;
    font-weight: 700;
    color: var(--ca-text-hint);
    margin-top: 4px;
    line-height: 1;
  }

  .countdown__tick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 72px;
  }

  .countdown__val {
    font-size: 44px;
    font-weight: 800;
    color: var(--ca-brand-text);
    letter-spacing: -0.03em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .countdown__label {
    font-size: 11px;
    color: var(--ca-text-hint);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
</style>

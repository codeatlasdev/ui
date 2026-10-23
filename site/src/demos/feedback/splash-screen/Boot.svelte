<script lang="ts">
  import { Button, SplashScreen } from '@codeatlasdev/ui';

  let boot = $state(0);
  let ready = $state(false);
  let seen = $state(0);

  function start() {
    ready = false;
    boot++;
    setTimeout(() => (ready = true), 1200);
  }
</script>

<Button variant="outlined" size="sm" onclick={start}>Boot the app</Button>
<p class="note">Splash screens shown: {seen}</p>

{#key boot}
  {#if boot > 0}
    <SplashScreen {ready} minDuration={800} ondone={() => seen++}>
      {#snippet logo()}<strong class="mark">Acme</strong>{/snippet}
    </SplashScreen>
  {/if}
{/key}

<style>
  .note { margin: var(--ca-space-2) 0 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
  .mark { font-family: var(--ca-font-display); font-size: var(--ca-font-size-h3); }
</style>

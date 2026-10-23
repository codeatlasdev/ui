<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { splashScreen } from '../../i18n/groups/splashScreen.js';
  const t = useMessages(splashScreen);

  /**
   * SplashScreen: a full-viewport brand screen shown while the app shell boots.
   *
   * It is a `role="status"` region named "Loading…". It leaves once `ready` is true AND it has been
   * visible for `minDuration`, so a fast boot never flashes it for one frame (pairs with
   * `LoadingBoundary`, which does the same for content). With `prefers-reduced-motion: reduce` it is
   * skipped: nothing renders and `ondone` fires at once.
   *
   *   <SplashScreen ready={session.loaded} minDuration={600} ondone={() => (booted = true)}>
   *     {#snippet logo()}<Wordmark />{/snippet}
   *   </SplashScreen>
   */
  interface Props {
    /** Brand mark shown in the middle. */
    logo?: Snippet;
    /** The app has finished booting. The splash waits for it, then for `minDuration`. */
    ready?: boolean;
    /** Minimum time (ms) the splash stays, counted from when it first shows. */
    minDuration?: number;
    /** Accessible name. Defaults to a localised "Loading…". */
    label?: string;
    /** Called once the splash is gone (or was skipped). */
    ondone?: () => void;
    class?: string;
  }

  let {
    logo,
    ready = true,
    minDuration = 600,
    label,
    ondone,
    class: className = '',
  }: Props = $props();

  // The server and the first client render keep the splash mounted (no hydration mismatch); the
  // effect below then removes it for a user who asked for reduced motion.
  let gone = $state(false);
  let minElapsed = $state(false);
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    gone = true;
    ondone?.();
  }

  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  });

  $effect(() => {
    if (minDuration <= 0) {
      minElapsed = true;
      return;
    }
    const timer = setTimeout(() => (minElapsed = true), minDuration);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    if (ready && minElapsed) finish();
  });
</script>

{#if !gone}
  <div class="ca-splash {className}" role="status" aria-label={label ?? t().splashScreen.label}>
    <div class="ca-splash__logo">
      {#if logo}{@render logo()}{/if}
    </div>
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-splash {
      position: fixed;
      inset: 0;
      z-index: var(--ca-z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ca-surface-base);
      color: var(--ca-text-primary);
      animation: ca-splash-in calc(var(--ca-duration-base) * var(--ca-motion-scale)) var(--ca-ease-standard);
    }
    .ca-splash__logo {
      animation: ca-splash-pulse calc(1600ms * var(--ca-motion-scale)) ease-in-out infinite;
    }
    @keyframes ca-splash-in { from { opacity: 0; } }
    @keyframes ca-splash-pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.6; }
    }
}
</style>

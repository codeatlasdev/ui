<script lang="ts">
  // A thin top bar for client-side navigations that take time. Reads `navigating` from
  // `$app/state`, so it lives in `/kit` (the rest of the package is router-agnostic).
  // It appears only after `delay` ms: a navigation that finishes first never flashes a bar.
  import { navigating } from '$app/state';
  import { useT } from '../i18n/state.svelte.js';
  const t = useT();

  interface Props {
    /** Wait this long (ms) before showing the bar; faster navigations show nothing. */
    delay?: number;
    /** Accessible name. Defaults to a localised "Loading…". */
    label?: string;
    class?: string;
  }

  let { delay = 120, label, class: className = '' }: Props = $props();

  let visible = $state(false);
  let active = $derived(navigating.to !== null);

  $effect(() => {
    if (!active) {
      visible = false;
      return;
    }
    const timer = setTimeout(() => (visible = true), delay);
    return () => clearTimeout(timer);
  });

  // Lets CSS and other UI react to a pending navigation (`html[data-ca-navigating]`).
  $effect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.setAttribute('data-ca-navigating', '');
    return () => root.removeAttribute('data-ca-navigating');
  });
</script>

<div class="ca-nav-progress {className}" data-ca-nav-progress hidden={!visible}>
  <div
    class="ca-nav-progress__bar"
    role="progressbar"
    aria-label={label ?? t().spinner.label}
    aria-valuemin={0}
    aria-valuemax={100}
  ></div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-nav-progress {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: var(--ca-z-snackbar);
      block-size: var(--ca-space-1);
      overflow: hidden;
      pointer-events: none;
    }
    .ca-nav-progress[hidden] { display: none; }
    .ca-nav-progress__bar {
      position: absolute;
      inset-block: 0;
      inline-size: 40%;
      background: var(--ca-brand-main);
      border-radius: var(--ca-radius-pill);
      animation: ca-nav-progress var(--ca-duration-loop) var(--ca-ease-standard) infinite;
    }
    @keyframes ca-nav-progress {
      from { inset-inline-start: -40%; }
      to { inset-inline-start: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ca-nav-progress__bar { inline-size: 100%; inset-inline-start: 0; animation: none; opacity: 0.6; }
    }
    @media (forced-colors: active) {
      .ca-nav-progress__bar { background: Highlight; }
    }
}
</style>

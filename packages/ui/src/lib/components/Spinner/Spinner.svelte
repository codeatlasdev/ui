<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  interface Props {
    size?: number | string;
    class?: string;
    label?: string;
  }
  let { size = 24, class: className = '', label }: Props = $props();
  let px = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
  role="status"
  aria-label={label ?? t().spinner.label}
  class="ca-spinner {className}"
  style="--spinner-size:{px}"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle
    class="ca-spinner__track"
    cx="12" cy="12" r="10"
    stroke-width="2.5"
  />
  <path
    class="ca-spinner__arc"
    d="M12 2 a10 10 0 0 1 10 10"
    stroke-width="2.5"
    stroke-linecap="round"
  />
</svg>

<style>
  .ca-spinner {
    display: inline-block;
    flex-shrink: 0;
    width: var(--spinner-size, var(--ca-space-6));
    height: var(--spinner-size, var(--ca-space-6));
    animation: ca-spin var(--ca-duration-spin) linear infinite;
  }
  .ca-spinner__track {
    stroke: var(--ca-outline-subtle);
  }
  .ca-spinner__arc {
    stroke: var(--ca-brand-main);
    fill: none;
  }
  @keyframes ca-spin {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ca-spinner {
      animation-duration: 2s;
    }
  }
</style>

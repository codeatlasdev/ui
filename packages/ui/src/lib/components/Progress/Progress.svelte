<script lang="ts">
  interface Props {
    value?: number;
    max?: number;
    indeterminate?: boolean;
    class?: string;
    label?: string;
  }

  let {
    value = 0,
    max = 100,
    indeterminate = false,
    class: className = '',
    label,
  }: Props = $props();

  let pct = $derived(
    indeterminate ? null : Math.min(100, Math.max(0, (value / max) * 100))
  );
</script>

<div
  class="ca-progress {className}"
  role="progressbar"
  aria-valuenow={indeterminate ? undefined : value}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-label={label}
>
  <div class="ca-progress__track">
    <div
      class="ca-progress__indicator{indeterminate ? ' ca-progress__indicator--indeterminate' : ''}"
      style={!indeterminate && pct !== null ? `width:${pct}%` : undefined}
    ></div>
  </div>
</div>

<style>
  .ca-progress {
    width: 100%;
  }

  .ca-progress__track {
    width: 100%;
    height: var(--ca-space-2);
    background: var(--ca-outline-default);
    border-radius: var(--ca-radius-pill);
    overflow: hidden;
    position: relative;
  }

  .ca-progress__indicator {
    height: 100%;
    background: var(--ca-brand-main);
    border-radius: var(--ca-radius-pill);
    transition: width var(--ca-duration-base) var(--ca-ease-standard);
  }

  .ca-progress__indicator--indeterminate {
    width: 40% !important;
    animation: ca-progress-shimmer var(--ca-duration-loop) var(--ca-ease-standard) infinite;
  }

  @keyframes ca-progress-shimmer {
    0%   { transform: translateX(-150%); }
    100% { transform: translateX(350%); }
  }
</style>

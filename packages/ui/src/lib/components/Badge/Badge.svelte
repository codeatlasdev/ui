<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';

  interface Props {
    count?: number;
    dot?: boolean;
    color?: 'brand' | 'success' | 'error' | 'warning';
    class?: string;
    children?: Snippet;
  }

  let { count, dot = false, color = 'brand', class: className = '', children }: Props = $props();

  let showBadge = $derived(dot || (count !== undefined && count > 0));
  let label = $derived(count !== undefined && count > 99 ? '99+' : String(count ?? ''));
</script>

<span class="ca-badge-wrapper {className}">
  {@render children?.()}
  {#if showBadge}
    <span
      class="ca-badge ca-badge--{color}"
      class:ca-badge--dot={dot}
      aria-label={dot ? t().badge.new : t().badge.notifications(count ?? 0)}
      role="status"
    >
      {#if !dot}{label}{/if}
    </span>
  {/if}
</span>

<style>
  .ca-badge-wrapper {
    position: relative;
    display: inline-flex;
  }

  .ca-badge {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(25%, -25%);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ca-radius-pill);
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-bold);
    line-height: 1;
    padding: 0 var(--ca-space-1);
    min-width: calc(var(--ca-space-4) + var(--ca-space-0-5));
    height: calc(var(--ca-space-4) + var(--ca-space-0-5));
    border: var(--ca-border-width-strong) solid var(--ca-surface-base);
  }

  .ca-badge--dot {
    width: var(--ca-space-2);
    min-width: var(--ca-space-2);
    height: var(--ca-space-2);
    padding: 0;
    border-radius: 50%;
  }

  .ca-badge--brand {
    background: var(--ca-brand-fill);
    color: var(--ca-brand-contrast);
  }

  .ca-badge--success {
    background: var(--ca-semantic-success);
    color: var(--ca-on-semantic);
  }

  .ca-badge--error {
    background: var(--ca-semantic-error);
    color: var(--ca-on-semantic);
  }

  .ca-badge--warning {
    background: var(--ca-semantic-warning);
    color: var(--ca-on-semantic);
  }
</style>

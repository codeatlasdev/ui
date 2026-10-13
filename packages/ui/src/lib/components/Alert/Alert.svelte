<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import type { Snippet } from 'svelte';
  import { CheckCircle2, AlertTriangle, XCircle, Info, X } from '@lucide/svelte';

  interface Props {
    severity: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    closable?: boolean;
    onclose?: () => void;
    class?: string;
    children?: Snippet;
  }

  let { severity, title, closable = false, onclose, class: className = '', children }: Props = $props();

  const icons = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  let Icon = $derived(icons[severity]);
</script>

<div class="ca-alert ca-alert--{severity} {className}" role="alert" aria-live="polite">
  <div class="ca-alert__bar" aria-hidden="true"></div>
  <span class="ca-alert__icon" aria-hidden="true">
    <Icon size={18} stroke-width={2} />
  </span>
  <div class="ca-alert__body">
    {#if title}
      <p class="ca-alert__title">{title}</p>
    {/if}
    <div class="ca-alert__content">
      {@render children?.()}
    </div>
  </div>
  {#if closable}
    <button
      class="ca-alert__close"
      type="button"
      aria-label={t().alert.dismiss}
      onclick={onclose}
    >
      <X size={16} />
    </button>
  {/if}
</div>

<style>
  .ca-alert {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--ca-space-2-5);
    padding: var(--ca-space-3) var(--ca-space-3) var(--ca-space-3) var(--ca-space-4);
    border-radius: var(--ca-radius-md);
    position: relative;
    overflow: hidden;
    border: var(--ca-border-width) solid var(--ca-alert-border-color);
    box-shadow: var(--ca-alert-shadow);
  }

  .ca-alert__bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--ca-space-1);
    border-radius: var(--ca-radius-xs) 0 0 var(--ca-radius-xs);
  }

  .ca-alert__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: var(--ca-border-width);
  }

  .ca-alert__body {
    flex: 1;
    min-width: 0;
  }

  .ca-alert__title {
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-semibold);
    margin: 0 0 var(--ca-space-0-5);
  }

  .ca-alert__content {
    font-size: var(--ca-font-size-body2);
    line-height: var(--ca-line-height-relaxed);
  }

  .ca-alert__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ca-space-7);
    height: var(--ca-space-7);
    border-radius: var(--ca-radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--ca-duration-fast) var(--ca-ease-standard),
                background var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-alert__close:hover {
    opacity: 1;
    background: var(--ca-action-hover);
  }

  .ca-alert__close:focus-visible {
    outline: var(--ca-border-width-focus) solid currentColor;
    outline-offset: var(--ca-border-width);
    opacity: 1;
  }

  /* Success */
  .ca-alert--success {
    background: color-mix(in oklab, var(--ca-semantic-success) 8%, var(--ca-alert-surface));
    border-color: color-mix(in oklab, var(--ca-semantic-success) 20%, transparent);
    color: var(--ca-text-primary);
  }
  .ca-alert--success .ca-alert__bar { background: var(--ca-semantic-success); }
  .ca-alert--success .ca-alert__icon { color: var(--ca-semantic-success); }

  /* Warning */
  .ca-alert--warning {
    background: color-mix(in oklab, var(--ca-semantic-warning) 8%, var(--ca-alert-surface));
    border-color: color-mix(in oklab, var(--ca-semantic-warning) 20%, transparent);
    color: var(--ca-text-primary);
  }
  .ca-alert--warning .ca-alert__bar { background: var(--ca-semantic-warning); }
  .ca-alert--warning .ca-alert__icon { color: var(--ca-semantic-warning); }

  /* Error */
  .ca-alert--error {
    background: color-mix(in oklab, var(--ca-semantic-error) 8%, var(--ca-alert-surface));
    border-color: color-mix(in oklab, var(--ca-semantic-error) 20%, transparent);
    color: var(--ca-text-primary);
  }
  .ca-alert--error .ca-alert__bar { background: var(--ca-semantic-error); }
  .ca-alert--error .ca-alert__icon { color: var(--ca-semantic-error); }

  /* Info */
  .ca-alert--info {
    background: color-mix(in oklab, var(--ca-semantic-info) 8%, var(--ca-alert-surface));
    border-color: color-mix(in oklab, var(--ca-semantic-info) 20%, transparent);
    color: var(--ca-text-primary);
  }
  .ca-alert--info .ca-alert__bar { background: var(--ca-semantic-info); }
  .ca-alert--info .ca-alert__icon { color: var(--ca-semantic-info); }
</style>

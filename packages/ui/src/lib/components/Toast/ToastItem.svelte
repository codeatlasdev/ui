<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { ToastItem as ToastItemType } from '../../stores/toast.svelte.js';
  import { X, CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/svelte';
  const t = useT();

  interface Props {
    item: ToastItemType;
    onclose: () => void;
  }

  let { item, onclose }: Props = $props();

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    default: null,
  } as const;

  let Icon = $derived(icons[item.variant]);

  // Enter/exit via CSS animation, no will-change: transform
  let visible = $state(false);
  $effect(() => { requestAnimationFrame(() => { visible = true; }); });
</script>

<div
  role="status"
  class="ca-toast ca-toast--{item.variant}"
  class:ca-toast--visible={visible}
>
  {#if Icon}
    {@const IconComponent = Icon}
    <IconComponent size={18} class="ca-toast__icon" />
  {/if}
  <span class="ca-toast__message">{item.message}</span>
  <button
    class="ca-toast__close"
    type="button"
    aria-label={t().toast.dismiss}
    onclick={onclose}
  >
    <X size={14} />
  </button>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-toast {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2-5);
      padding: var(--ca-space-3) var(--ca-space-4);
      border-radius: var(--ca-radius-md);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      background: var(--ca-glass-bg);
      -webkit-backdrop-filter: var(--ca-blur-thick);
      backdrop-filter: var(--ca-blur-thick);
      box-shadow: var(--ca-shadow-md);
      pointer-events: all;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
      opacity: 0;
      transform: translateY(var(--ca-space-2));
      transition:
        opacity var(--ca-duration-base) var(--ca-ease-decelerate),
        transform var(--ca-duration-base) var(--ca-ease-decelerate);
    }

    .ca-toast--visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Accent left border by variant */
    .ca-toast--success  { border-left: var(--ca-border-width-strong) solid var(--ca-semantic-success); }
    .ca-toast--error    { border-left: var(--ca-border-width-strong) solid var(--ca-semantic-error); }
    .ca-toast--warning  { border-left: var(--ca-border-width-strong) solid var(--ca-semantic-warning); }
    .ca-toast--info     { border-left: var(--ca-border-width-strong) solid var(--ca-semantic-info); }

    .ca-toast__message {
      flex: 1;
      line-height: var(--ca-line-height-body);
    }

    .ca-toast__close {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ca-text-hint);
      padding: var(--ca-space-0-5);
      border-radius: var(--ca-radius-xs);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-toast__close:hover { color: var(--ca-text-primary); }

    @media (prefers-reduced-motion: reduce) {
      .ca-toast {
        transition: opacity var(--ca-duration-fast) var(--ca-ease-standard);
        transform: none;
      }
    }
}
</style>

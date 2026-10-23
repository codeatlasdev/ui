<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { toast } from '../../i18n/groups/toast.js';
  import type { ToastItem as ToastItemType } from '../../stores/toast.svelte.js';
  import { X, CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/svelte';
  const t = useMessages(toast);

  interface Props {
    item: ToastItemType;
    onclose: () => void;
    /** Hover or focus entered the toast: hold the auto-dismiss timer (WCAG 2.2.1). */
    onpause?: () => void;
    onresume?: () => void;
  }

  let { item, onclose, onpause, onresume }: Props = $props();

  // Errors and warnings interrupt (role=alert); the rest is polite status. The description is
  // inside the same element, so it is read as one announcement.
  let role = $derived(item.variant === 'error' || item.variant === 'warning' ? 'alert' : 'status');

  // Pause while the pointer is over the toast or focus is inside it; resume once neither holds.
  let hovered = false;
  let focused = false;
  function sync() {
    if (hovered || focused) onpause?.();
    else onresume?.();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onclose();
    }
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    default: null,
  } as const;

  let Icon = $derived(icons[item.variant]);
  let count = $derived(item.count ?? 1);

  // Enter/exit via CSS animation, no will-change: transform
  let visible = $state(false);
  $effect(() => { requestAnimationFrame(() => { visible = true; }); });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  {role}
  class="ca-toast ca-toast--{item.variant}"
  data-ca-blur="thick"
  class:ca-toast--visible={visible}
  onmouseenter={() => { hovered = true; sync(); }}
  onmouseleave={() => { hovered = false; sync(); }}
  onfocusin={() => { focused = true; sync(); }}
  onfocusout={(e) => { focused = e.currentTarget.contains(e.relatedTarget as Node | null); sync(); }}
  {onkeydown}
>
  {#if Icon}
    {@const IconComponent = Icon}
    <IconComponent size={18} class="ca-toast__icon" />
  {/if}
  <div class="ca-toast__body">
    <span class="ca-toast__message">{item.message}</span>
    {#if item.description}
      <span class="ca-toast__description">{item.description}</span>
    {/if}
    {#if item.action}
      {@const action = item.action}
      <button
        class="ca-toast__action"
        type="button"
        onclick={() => { action.onClick(); onclose(); }}
      >{action.label}</button>
    {/if}
  </div>
  {#if count > 1}
    <span class="ca-toast__count" aria-hidden="true">×{count}</span>
    <span class="ca-sr-only">{t().toast.repeated(count)}</span>
  {/if}
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
      box-shadow: var(--ca-shadow-md);
      pointer-events: all;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
      opacity: 0;
      transform: translateY(var(--ca-space-2));
      transition:
        opacity var(--ca-enter-base) var(--ca-ease-decelerate),
        transform var(--ca-enter-base) var(--ca-ease-decelerate);
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

    .ca-toast__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ca-space-0-5);
    }

    .ca-toast__message {
      line-height: var(--ca-line-height-body);
    }

    .ca-toast__description {
      font-size: var(--ca-font-size-caption);
      line-height: var(--ca-line-height-body);
      color: var(--ca-text-secondary);
    }

    /* Text button, not tinted with the brand: primary text + underline reads on every variant. */
    .ca-toast__action {
      margin-top: var(--ca-space-1);
      padding: var(--ca-space-0-5) 0;
      background: none;
      border: none;
      border-radius: var(--ca-radius-xs);
      font: inherit;
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-primary);
      text-decoration: underline;
      text-underline-offset: var(--ca-space-0-5);
      cursor: pointer;
    }

    .ca-toast__action:hover { text-decoration-thickness: 2px; }

    .ca-toast__count {
      flex-shrink: 0;
      padding: 0 var(--ca-space-1-5);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-outline-subtle);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-caption);
      font-variant-numeric: tabular-nums;
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
        transition: opacity var(--ca-enter-fast) var(--ca-ease-standard);
        transform: none;
      }
    }
}
</style>

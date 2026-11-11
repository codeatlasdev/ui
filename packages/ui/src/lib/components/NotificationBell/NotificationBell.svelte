<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { notificationBell } from '../../i18n/groups/notificationBell.js';
  import { Bell, Check } from '@lucide/svelte';
  import { uid } from '../../utils/index.js';
  import { announce } from '../../utils/announce.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { createTriggerProps, tabIntoPopup } from '../Popover/trigger.js';
  import Badge from '../Badge/Badge.svelte';
  import Button from '../Button/Button.svelte';
  import type { Align, Side } from '../../primitives/index.js';
  import { type Component, type Snippet, untrack } from 'svelte';
  const t = useMessages(notificationBell);

  export interface NotificationItem {
    id: string;
    title: string;
    body?: string;
    time?: string;
    read?: boolean;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
    /** Link target. The row becomes an `<a>`; a separate "mark as read" button replaces the row-as-action. */
    href?: string;
    /** Leading icon (a lucide component) shown in place of the unread dot, tinted by `variant`. */
    icon?: Component<{ size?: number; 'stroke-width'?: number; 'aria-hidden'?: 'true' }>;
  }

  export interface NotificationItemControls {
    /** Closes the panel and returns focus to the bell. */
    close: () => void;
    /** Calls `onRead` for this notification (no-op when it is already read). */
    markRead: () => void;
  }

  interface Props {
    notifications?: NotificationItem[];
    /** Bindable. Whether the panel is open. */
    open?: boolean;
    /** Called when the user opens or closes the panel, not when the parent sets open. */
    onOpenChange?: (open: boolean) => void;
    /** Unread total. Defaults to the unread notifications in the list. */
    count?: number;
    /** Shows loading text while keeping loaded notifications visible. */
    loading?: boolean;
    /** Load failure: shows the message and a retry button (when `onRetry` is set) above any loaded notifications. `loading` wins while it is true. */
    error?: { onRetry?: () => void; message?: string };
    /** Replaces the `empty` string when there are no notifications. */
    emptyContent?: Snippet;
    /** Owns one row: `(notification, { close, markRead })`. Replaces the default row, `href` and `icon` included. */
    item?: Snippet<[NotificationItem, NotificationItemControls]>;
    /** Panel side of the bell. Default `bottom`; flips when it does not fit. */
    side?: Side;
    /** Panel alignment on that side. Default `end`. */
    align?: Align;
    /** Gap between bell and panel in px. Default 8. */
    sideOffset?: number;
    /** Panel width, any CSS length (`420px`, `30rem`). Default 340px; never wider than the viewport. */
    width?: string;
    /** The badge shows `max+` above this count. Default 99. The accessible name keeps the real count. */
    max?: number;
    onRead?: (id: string) => void;
    onReadAll?: () => void;
    onClear?: () => void;
    class?: string;
    children?: Snippet;
    /** Label overrides for i18n. Defaults to English strings. */
    labels?: {
      title?:   string;
      markAll?: string;
      clear?:   string;
      empty?:   string;
      loading?: string;
      error?:   string;
      retry?:   string;
      /** `(title) => string`: name of the per-row mark-as-read button. */
      markRead?: (title: string) => string;
    };
  }

  let {
    notifications = [],
    open = $bindable(false),
    onOpenChange,
    count,
    loading = false,
    error,
    emptyContent,
    item,
    side = 'bottom',
    align = 'end',
    sideOffset = 8,
    width,
    max = 99,
    onRead,
    onReadAll,
    onClear,
    class: className = '',
    children,
    labels = {},
  }: Props = $props();

  let unread = $derived(count ?? notifications.filter(n => !n.read).length);
  let lastUnread = untrack(() => unread);
  $effect(() => {
    const next = unread;
    if (next === lastUnread) return;
    lastUnread = next;
    announce(t().notificationBell.label(next));
  });

  const id = uid('notif');
  let anchor = $state<HTMLElement | null>(null);
  let panel = $state<HTMLElement | null>(null);

  // Restore focus before a closing panel removes its focused child.
  $effect.pre(() => {
    if (!open && panel?.contains(document.activeElement)) anchor?.focus({ preventScroll: true });
  });

  // FloatingLayer owns the element, so the width token is set on it from here.
  $effect(() => {
    if (!panel) return;
    if (width) panel.style.setProperty('--ca-notif-width', width);
    else panel.style.removeProperty('--ca-notif-width');
  });

  function setOpen(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

  const makeTrigger = createTriggerProps((el) => (anchor = el));
  const triggerAttrs = $derived(
    makeTrigger({ id: `${id}-trigger`, popup: 'dialog', open, controls: `${id}-panel`, onToggle: () => setOpen(!open), onKeydown: (e) => open && tabIntoPopup(e, panel) })
  );

  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }
</script>

<button
  type="button"
  class="ca-notif-trigger {children ? '' : 'ca-notif-bell'} {className}"
  aria-label={t().notificationBell.label(unread)}
  {...triggerAttrs}
>
  {#if children}
    {@render children()}
  {:else}
    <Badge count={unread || undefined} {max} color="error">
      <Bell size={20} stroke-width={1.8} aria-hidden="true" />
    </Badge>
  {/if}
</button>

<FloatingLayer
  {anchor}
  {open}
  {side}
  {align}
  {sideOffset}
  bind:ref={panel}
  id="{id}-panel"
  role="dialog"
  aria-label={labels.title ?? t().notificationBell.title}
  tabindex={-1}
  class="ca-notif-panel glass-panel"
  onDismiss={(reason) => close(reason === 'escape')}
>
      <div class="ca-notif-header">
        <span class="ca-notif-title">{labels.title ?? t().notificationBell.title}</span>
        <div class="ca-notif-actions">
          {#if unread > 0}
            <Button variant="ghost" size="sm" class="ca-notif-action" onclick={() => onReadAll?.()}>
              {labels.markAll ?? t().notificationBell.markAll}
            </Button>
          {/if}
          {#if onClear && notifications.length > 0}
            <Button variant="ghost" tone="neutral" size="sm" class="ca-notif-action" onclick={() => onClear?.()}>
              {labels.clear ?? t().notificationBell.clear}
            </Button>
          {/if}
        </div>
      </div>

      {#if loading}
        <div class="ca-notif-empty">{labels.loading ?? t().notificationBell.loading}</div>
      {:else if error}
        <div class="ca-notif-error" role="alert">
          <span>{error.message ?? labels.error ?? t().notificationBell.error}</span>
          {#if error.onRetry}
            <Button variant="outlined" size="sm" onclick={() => error.onRetry?.()}>
              {labels.retry ?? t().notificationBell.retry}
            </Button>
          {/if}
        </div>
      {/if}
      {#if notifications.length === 0}
        {#if !loading && !error}
          {#if emptyContent}
            {@render emptyContent()}
          {:else}
            <div class="ca-notif-empty">{labels.empty ?? t().notificationBell.empty}</div>
          {/if}
        {/if}
      {:else}
        <ul class="ca-notif-list">
          {#each notifications as n (n.id)}
            <li class="ca-notif-item" class:ca-notif-item--unread={!n.read}>
              {#if item}
                {@render item(n, { close: () => close(true), markRead: () => { if (!n.read) onRead?.(n.id); } })}
              {:else}
                {#snippet content()}
                  {#if n.icon}
                    {@const Icon = n.icon}
                    <span class="ca-notif-item__icon ca-notif-item__dot--{n.variant ?? 'default'}">
                      <Icon size={18} stroke-width={1.8} aria-hidden="true" />
                    </span>
                  {:else}
                    <div class="ca-notif-item__dot ca-notif-item__dot--{n.variant ?? 'default'}" aria-hidden="true"></div>
                  {/if}
                  <div class="ca-notif-item__body">
                    <span class="ca-notif-item__title">{n.title}</span>
                    {#if n.body}
                      <p class="ca-notif-item__text">{n.body}</p>
                    {/if}
                    {#if n.time}
                      <time class="ca-notif-item__time">{n.time}</time>
                    {/if}
                  </div>
                {/snippet}
                {#if n.href}
                  <a class="ca-notif-item__btn" href={n.href}>{@render content()}</a>
                  {#if !n.read && onRead}
                    <button
                      type="button"
                      class="ca-notif-item__read"
                      aria-label={(labels.markRead ?? t().notificationBell.markRead)(n.title)}
                      onclick={() => onRead?.(n.id)}
                    >
                      <Check size={16} stroke-width={2} aria-hidden="true" />
                    </button>
                  {/if}
                {:else}
                  <button
                    type="button"
                    class="ca-notif-item__btn"
                    onclick={() => { if (!n.read) onRead?.(n.id); }}
                  >{@render content()}</button>
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-notif-trigger) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
    }

    :global(.ca-notif-bell) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-control-height);
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-control);
      border: none;
      background: none;
      cursor: pointer;
      color: var(--ca-text-secondary);
      transition: background var(--ca-duration-fast) var(--ca-ease-standard),
                  color var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-notif-bell:hover) {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    :global(.ca-notif-panel) {
      width: var(--ca-notif-width, 340px);
      max-width: calc(100vw - var(--ca-space-4));
      max-height: min(480px, var(--ca-available-height, 480px));
      border-radius: var(--ca-radius-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
    }

    .ca-notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ca-space-3-5) var(--ca-space-4) var(--ca-space-2-5);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      flex-shrink: 0;
    }

    .ca-notif-title {
      font-size: var(--ca-font-size-body2);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
    }

    .ca-notif-actions {
      display: flex;
      gap: var(--ca-space-2);
    }

    .ca-notif-actions {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .ca-notif-error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-3);
      padding: var(--ca-space-3) var(--ca-space-4);
      font-size: var(--ca-font-size-body2);
      color: var(--ca-semantic-error-text, var(--ca-semantic-error));
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-notif-empty {
      padding: var(--ca-space-8) var(--ca-space-4);
      text-align: center;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-hint);
    }

    .ca-notif-list {
      list-style: none;
      margin: 0;
      padding: var(--ca-space-1-5);
      overflow-y: auto;
      flex: 1;
    }

    .ca-notif-item {
      border-radius: var(--ca-radius-sm);
      overflow: hidden;
      display: flex;
      align-items: flex-start;
    }

    .ca-notif-item__btn {
      display: flex;
      align-items: flex-start;
      gap: var(--ca-space-2-5);
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      padding: var(--ca-space-2-5);
      color: inherit;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
      border-radius: var(--ca-radius-sm);
      outline: none;
    }

    .ca-notif-item__btn:hover,
    .ca-notif-item__btn:focus-visible {
      background: var(--ca-action-hover);
    }

    .ca-notif-item__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: var(--ca-space-1-5);
    }

    .ca-notif-item__icon {
      display: inline-flex;
      flex-shrink: 0;
      margin-top: var(--ca-space-0-5);
      background: none !important;
    }
    .ca-notif-item__icon.ca-notif-item__dot--default { color: var(--ca-brand-main); }
    .ca-notif-item__icon.ca-notif-item__dot--info    { color: var(--ca-semantic-info); }
    .ca-notif-item__icon.ca-notif-item__dot--success { color: var(--ca-semantic-success); }
    .ca-notif-item__icon.ca-notif-item__dot--warning { color: var(--ca-semantic-warning); }
    .ca-notif-item__icon.ca-notif-item__dot--error   { color: var(--ca-semantic-error); }

    .ca-notif-item__read {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-control-height-sm);
      height: var(--ca-control-height-sm);
      margin: var(--ca-space-1);
      border: none;
      border-radius: var(--ca-radius-control);
      background: none;
      color: var(--ca-text-secondary);
      cursor: pointer;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard),
                  color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-notif-item__read:hover,
    .ca-notif-item__read:focus-visible {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    @media (pointer: coarse) {
      .ca-notif-item__read {
        width: var(--ca-touch-target);
        height: var(--ca-touch-target);
        margin: 0;
      }
    }

    .ca-notif-item--unread .ca-notif-item__dot { opacity: 1; }
    .ca-notif-item:not(.ca-notif-item--unread) .ca-notif-item__dot { opacity: 0; }

    .ca-notif-item__dot--default { background: var(--ca-brand-main); }
    .ca-notif-item__dot--info    { background: var(--ca-semantic-info); }
    .ca-notif-item__dot--success { background: var(--ca-semantic-success); }
    .ca-notif-item__dot--warning { background: var(--ca-semantic-warning); }
    .ca-notif-item__dot--error   { background: var(--ca-semantic-error); }

    .ca-notif-item__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-0-5);
    }

    .ca-notif-item__title {
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
    }

    .ca-notif-item--unread .ca-notif-item__title {
      font-weight: var(--ca-font-weight-semibold);
    }

    .ca-notif-item__text {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      line-height: var(--ca-line-height-body);
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--ca-notif-body-lines, 4);
      line-clamp: var(--ca-notif-body-lines, 4);
      overflow: hidden;
    }

    .ca-notif-item__time {
      font-size: var(--ca-font-size-micro);
      color: var(--ca-text-hint);
    }
}
</style>

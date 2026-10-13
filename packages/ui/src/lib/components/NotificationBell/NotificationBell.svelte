<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { Bell } from '@lucide/svelte';
  import { Popover as BitsPopover } from 'bits-ui';
  import Badge from '../Badge/Badge.svelte';
  import type { Snippet } from 'svelte';

  export interface NotificationItem {
    id: string;
    title: string;
    body?: string;
    time?: string;
    read?: boolean;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  }

  interface Props {
    notifications?: NotificationItem[];
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
    };
  }

  let {
    notifications = [],
    onRead,
    onReadAll,
    onClear,
    class: className = '',
    children,
    labels = {},
  }: Props = $props();

  let unread = $derived(notifications.filter(n => !n.read).length);
</script>

<BitsPopover.Root>
  <BitsPopover.Trigger
    class="ca-notif-trigger {children ? '' : 'ca-notif-bell'} {className}"
    aria-label={t().notificationBell.label(unread)}
  >
    {#if children}
      {@render children()}
    {:else}
      <Badge count={unread || undefined} color="error">
        <Bell size={20} stroke-width={1.8} aria-hidden="true" />
      </Badge>
    {/if}
  </BitsPopover.Trigger>

  <BitsPopover.Portal>
    <BitsPopover.Content
      class="ca-notif-panel glass-panel"
      sideOffset={8}
      align="end"
    >
      <div class="ca-notif-header">
        <span class="ca-notif-title">{labels.title ?? t().notificationBell.title}</span>
        <div class="ca-notif-actions">
          {#if unread > 0}
            <button type="button" class="ca-notif-action" onclick={() => onReadAll?.()}>
              {labels.markAll ?? t().notificationBell.markAll}
            </button>
          {/if}
          {#if notifications.length > 0}
            <button type="button" class="ca-notif-action" onclick={() => onClear?.()}>
              {labels.clear ?? t().notificationBell.clear}
            </button>
          {/if}
        </div>
      </div>

      {#if notifications.length === 0}
        <div class="ca-notif-empty">{labels.empty ?? t().notificationBell.empty}</div>
      {:else}
        <ul class="ca-notif-list">
          {#each notifications as n}
            <li class="ca-notif-item" class:ca-notif-item--unread={!n.read}>
              <button
                type="button"
                class="ca-notif-item__btn"
                onclick={() => { if (!n.read) onRead?.(n.id); }}
              >
                <div class="ca-notif-item__dot ca-notif-item__dot--{n.variant ?? 'default'}" aria-hidden="true"></div>
                <div class="ca-notif-item__body">
                  <span class="ca-notif-item__title">{n.title}</span>
                  {#if n.body}
                    <p class="ca-notif-item__text">{n.body}</p>
                  {/if}
                  {#if n.time}
                    <time class="ca-notif-item__time">{n.time}</time>
                  {/if}
                </div>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </BitsPopover.Content>
  </BitsPopover.Portal>
</BitsPopover.Root>

<style>
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
    width: 340px;
    max-height: 480px;
    border-radius: var(--ca-radius-xl);
    z-index: var(--ca-z-dropdown);
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

  .ca-notif-action {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-brand-text);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--ca-space-0-5) var(--ca-space-1);
    border-radius: var(--ca-radius-xs);
  }

  .ca-notif-action:hover {
    background: var(--ca-action-hover);
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
  }

  .ca-notif-item__btn {
    display: flex;
    align-items: flex-start;
    gap: var(--ca-space-2-5);
    width: 100%;
    padding: var(--ca-space-2-5);
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ca-notif-item__time {
    font-size: var(--ca-font-size-micro);
    color: var(--ca-text-hint);
  }
</style>

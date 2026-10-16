<script lang="ts">
  import type { Snippet } from 'svelte';
  import { BellOff, Pin } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  const t = useT();

  /**
   * ConversationItem: one row of an inbox. Avatar, then title and time on the first line, preview
   * and indicators (pinned, muted, unread count) on the second. The whole row is the hit area.
   * Renders `<a>` with `href`, otherwise `<button type="button">`.
   *
   * Usage:
   *   <ConversationItem title="Ana" time="14:32" preview="See you" unread={3} active onclick={open}>
   *     {#snippet avatar()}<Avatar fallback="A" />{/snippet}
   *   </ConversationItem>
   */
  interface Props {
    /** Conversation name. */
    title: string;
    /** Time of the last message, for example `14:32`. */
    time?: string;
    /** Last message, truncated to one line. */
    preview?: string;
    /** Leading icon or ticks rendered before the preview. */
    previewIcon?: Snippet;
    /** Avatar slot. */
    avatar?: Snippet;
    /** Unread count. Shown as a pill, capped at `99+`. Hidden at 0. */
    unread?: number;
    /** Show the pin indicator. */
    pinned?: boolean;
    /** Show the muted indicator and quiet the unread pill. */
    muted?: boolean;
    /** Selected row: `aria-current="true"` and a selected background. */
    active?: boolean;
    /** Replace the preview with the typing label. */
    typing?: boolean;
    /** Renders an `<a>` instead of a button. */
    href?: string;
    /** Click handler. */
    onclick?: (event: MouseEvent) => void;
    /** Extra class on the row. */
    class?: string;
  }
  let {
    title,
    time,
    preview,
    previewIcon,
    avatar,
    unread,
    pinned = false,
    muted = false,
    active = false,
    typing = false,
    href,
    onclick,
    class: className = '',
  }: Props = $props();

  let hasUnread = $derived(!!unread && unread > 0);
  let unreadText = $derived(unread && unread > 99 ? '99+' : String(unread ?? 0));
</script>

{#snippet content()}
  {#if avatar}<span class="ca-conversation__avatar">{@render avatar()}</span>{/if}
  <span class="ca-conversation__main">
    <span class="ca-conversation__line">
      <span class="ca-conversation__title">{title}</span>
      {#if time}<span class="ca-conversation__time">{time}</span>{/if}
    </span>
    <span class="ca-conversation__line">
      <span class="ca-conversation__previewrow">
        {#if previewIcon && !typing}<span class="ca-conversation__previewicon">{@render previewIcon()}</span>{/if}
        {#if typing}
          <span class="ca-conversation__preview ca-conversation__preview--typing">{t().chat.typing}</span>
        {:else if preview}
          <span class="ca-conversation__preview">{preview}</span>
        {/if}
      </span>
      <span class="ca-conversation__flags">
        {#if muted}<BellOff size={14} role="img" aria-label={t().chat.muted} />{/if}
        {#if pinned}<Pin size={14} role="img" aria-label={t().chat.pinned} />{/if}
        {#if hasUnread}
          <span
            class="ca-conversation__unread"
            class:ca-conversation__unread--muted={muted}
            role="img"
            aria-label={t().chat.unread(unread ?? 0)}>{unreadText}</span>
        {/if}
      </span>
    </span>
  </span>
{/snippet}

{#if href}
  <a
    {href}
    class="ca-conversation {className}"
    class:ca-conversation--unread={hasUnread}
    class:ca-conversation--active={active}
    aria-current={active ? 'true' : undefined}
    {onclick}
  >{@render content()}</a>
{:else}
  <button
    type="button"
    class="ca-conversation {className}"
    class:ca-conversation--unread={hasUnread}
    class:ca-conversation--active={active}
    aria-current={active ? 'true' : undefined}
    {onclick}
  >{@render content()}</button>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-conversation {
      display: flex;
      align-items: center;
      gap: var(--ca-space-3);
      inline-size: 100%;
      min-block-size: 3.5rem;
      padding: var(--ca-space-2) var(--ca-space-3);
      border-radius: var(--ca-radius-md);
      background: transparent;
      color: var(--ca-text-primary);
      font: inherit;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
      transition: background var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-conversation:hover { background: var(--ca-action-hover); }
    .ca-conversation--active,
    .ca-conversation--active:hover { background: var(--ca-action-selected); }
    .ca-conversation:focus-visible {
      outline: 2px solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-focus-ring-offset) * -1);
    }

    .ca-conversation__avatar { flex: none; display: inline-flex; }
    .ca-conversation__main {
      flex: 1;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-0-5);
    }
    .ca-conversation__line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ca-space-2);
      min-inline-size: 0;
    }
    .ca-conversation__title {
      flex: 1;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ca-font-size-body1);
      font-weight: 500;
    }
    .ca-conversation__time {
      flex: none;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }
    .ca-conversation--unread .ca-conversation__title,
    .ca-conversation--unread .ca-conversation__time {
      font-weight: 700;
      color: var(--ca-brand-text);
    }

    .ca-conversation__previewrow {
      flex: 1;
      min-inline-size: 0;
      display: flex;
      align-items: center;
      gap: var(--ca-space-1);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-body2);
    }
    .ca-conversation__previewicon { flex: none; display: inline-flex; }
    .ca-conversation__preview {
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ca-conversation__preview--typing { color: var(--ca-brand-text); }

    .ca-conversation__flags {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      color: var(--ca-text-secondary);
    }
    .ca-conversation__unread {
      min-inline-size: 1.25rem;
      padding: 0 var(--ca-space-1);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
      font-size: var(--ca-font-size-caption);
      font-weight: 600;
      line-height: 1.25rem;
      text-align: center;
    }
    .ca-conversation__unread--muted {
      background: var(--ca-text-hint);
      color: var(--ca-surface-base);
    }

    @media (forced-colors: active) {
      .ca-conversation--active { border: 1px solid CanvasText; }
      .ca-conversation__unread { border: 1px solid CanvasText; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ca-conversation { transition: none; }
    }
}
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Check, CheckCheck, Clock } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  const t = useT();

  type Direction = 'in' | 'out';
  type Grouped = 'single' | 'first' | 'middle' | 'last';
  type Status = 'pending' | 'sent' | 'delivered' | 'read';
  type Reaction = { emoji: string; count?: number; mine?: boolean };

  /**
   * MessageBubble: one chat message. Incoming bubbles sit at the start with a raised surface,
   * outgoing ones at the end with the brand fill. Consecutive messages from the same sender are
   * grouped (`grouped`): only `single` and `last` get the tail corner and the avatar.
   *
   * The bubble is an `<article>` named by sender or direction. It has no live region: the list
   * that appends messages announces them. Delivery state is plain visually hidden text after the
   * time, so assistive tech reads "14:32, Delivered" once.
   *
   * Usage:
   *   <MessageBubble direction="out" time="14:32" status="read">Hello</MessageBubble>
   */
  interface Props {
    /** `in` aligns to the start (received), `out` to the end (sent). */
    direction?: Direction;
    /** Position inside a run from one sender; drives the tail, spacing, sender name and avatar. */
    grouped?: Grouped;
    /** Sender name above the text. Incoming bubbles at the start of a run only. */
    sender?: string;
    /** Avatar beside incoming bubbles. Shown on `single` and `last`; other positions reserve its width. */
    avatar?: Snippet;
    /** Reply preview rendered at the top of the bubble in a tinted block. */
    quote?: Snippet;
    /** Reaction chips overlapping the bottom edge of the bubble. */
    reactions?: Reaction[];
    /** Footer time text, for example `14:32`. */
    time?: string;
    /** Delivery state, shown as ticks. Outgoing bubbles only. */
    status?: Status;
    /** Message body. Whitespace is preserved and long words wrap. */
    children: Snippet;
    /** Extra footer content rendered before the time. */
    footer?: Snippet;
    /** Extra class on the row. */
    class?: string;
  }
  let {
    direction = 'in',
    grouped = 'single',
    sender,
    avatar,
    quote,
    reactions,
    time,
    status,
    children,
    footer,
    class: className = '',
  }: Props = $props();

  let showSender = $derived(
    direction === 'in' && !!sender && (grouped === 'single' || grouped === 'first')
  );
  let showAvatar = $derived(direction === 'in' && (grouped === 'single' || grouped === 'last'));
  let label = $derived(
    sender ? t().chat.from(sender) : direction === 'out' ? t().chat.outgoing : t().chat.incoming
  );
  let shownStatus = $derived(direction === 'out' ? status : undefined);
  let hasReactions = $derived(!!reactions && reactions.length > 0);
  let hasMeta = $derived(!!time || !!shownStatus || !!footer);
</script>

<div
  class="ca-bubble-row ca-bubble-row--{direction} {className}"
  data-grouped={grouped}
  class:ca-bubble-row--reacted={hasReactions}
>
  {#if direction === 'in' && avatar}
    <div class="ca-bubble-row__avatar">
      {#if showAvatar}{@render avatar()}{/if}
    </div>
  {/if}
  <article class="ca-bubble ca-bubble--{direction}" aria-label={label}>
    {#if quote}
      <div class="ca-bubble__quote">{@render quote()}</div>
    {/if}
    {#if showSender}<span class="ca-bubble__sender">{sender}</span>{/if}
    <div class="ca-bubble__body">{@render children()}</div>
    {#if hasMeta}
      <div class="ca-bubble__meta">
        {#if footer}{@render footer()}{/if}
        {#if time}<span class="ca-bubble__time">{time}</span>{/if}
        {#if shownStatus}
          <span class="ca-bubble__status ca-bubble__status--{shownStatus}">
            {#if shownStatus === 'pending'}
              <Clock size={14} aria-hidden="true" />
            {:else if shownStatus === 'sent'}
              <Check size={14} aria-hidden="true" />
            {:else}
              <CheckCheck size={14} aria-hidden="true" />
            {/if}
          </span>
          <span class="ca-sr-only">{t().chat.status[shownStatus]}</span>
        {/if}
      </div>
    {/if}
    {#if hasReactions && reactions}
      <div class="ca-bubble__reactions" role="group" aria-label={t().chat.reactions(reactions.length)}>
        {#each reactions as r, i (i)}
          <span class="ca-bubble__reaction" class:ca-bubble__reaction--mine={r.mine}>
            <span>{r.emoji}</span>{#if r.count !== undefined}<span class="ca-bubble__reaction-count">{r.count}</span>{/if}
          </span>
        {/each}
      </div>
    {/if}
  </article>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-bubble-row {
      --ca-bubble-radius: var(--ca-radius-lg);
      --ca-bubble-tail: var(--ca-radius-xs);
      --ca-bubble-avatar: 2rem;
      display: flex;
      align-items: flex-end;
      gap: var(--ca-space-2);
      margin-block-start: var(--ca-space-3);
      min-inline-size: 0;
    }
    .ca-bubble-row--out { justify-content: flex-end; }
    .ca-bubble-row[data-grouped='middle'],
    .ca-bubble-row[data-grouped='last'] { margin-block-start: var(--ca-space-0-5); }
    .ca-bubble-row--reacted { margin-block-end: var(--ca-space-3); }

    .ca-bubble-row__avatar {
      flex: none;
      inline-size: var(--ca-bubble-avatar);
      min-inline-size: var(--ca-bubble-avatar);
      display: flex;
      align-items: flex-end;
    }

    .ca-bubble {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      max-inline-size: min(78%, 36rem);
      min-inline-size: 0;
      padding: var(--ca-space-2) var(--ca-space-3);
      border-radius: var(--ca-bubble-radius);
      font-size: var(--ca-font-size-body2);
    }
    .ca-bubble--in {
      background: var(--ca-surface-raised);
      color: var(--ca-text-primary);
      box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
    }
    .ca-bubble--out {
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
    }

    /* Tail: the corner next to the sender gets a small radius on single and last. */
    .ca-bubble-row--in[data-grouped='single'] .ca-bubble,
    .ca-bubble-row--in[data-grouped='last'] .ca-bubble {
      border-end-start-radius: var(--ca-bubble-tail);
    }
    .ca-bubble-row--out[data-grouped='single'] .ca-bubble,
    .ca-bubble-row--out[data-grouped='last'] .ca-bubble {
      border-end-end-radius: var(--ca-bubble-tail);
    }

    .ca-bubble__sender {
      font-size: var(--ca-font-size-caption);
      font-weight: 600;
      color: var(--ca-brand-text);
    }
    .ca-bubble__body {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .ca-bubble__quote {
      padding: var(--ca-space-1) var(--ca-space-2);
      border-radius: var(--ca-radius-sm);
      border-inline-start: 3px solid currentColor;
      background: color-mix(in oklab, currentColor 12%, transparent);
      font-size: var(--ca-font-size-caption);
      overflow: hidden;
    }
    .ca-bubble__quote:empty { display: none; }

    .ca-bubble__meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ca-space-1);
      font-size: var(--ca-font-size-caption);
    }
    .ca-bubble--in .ca-bubble__meta { color: var(--ca-text-secondary); }
    .ca-bubble__status { display: inline-flex; align-items: center; }
    .ca-bubble__status--read { color: var(--ca-semantic-info); }

    .ca-bubble__reactions {
      position: absolute;
      inset-block-end: calc(var(--ca-space-3) * -1);
      inset-inline-end: var(--ca-space-2);
      display: flex;
      gap: var(--ca-space-1);
    }
    .ca-bubble__reaction {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      padding: 0 var(--ca-space-2);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-surface-base);
      color: var(--ca-text-primary);
      box-shadow: inset 0 0 0 1px var(--ca-outline-default);
      font-size: var(--ca-font-size-caption);
      line-height: 1.5rem;
    }
    .ca-bubble__reaction--mine {
      box-shadow: inset 0 0 0 1px var(--ca-brand-main);
      background: var(--ca-action-selected);
    }

    @media (forced-colors: active) {
      .ca-bubble { border: 1px solid CanvasText; }
      .ca-bubble__reaction { border: 1px solid CanvasText; }
      .ca-bubble__status--read { color: CanvasText; }
    }
}
</style>

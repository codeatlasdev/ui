<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { onDestroy, untrack } from 'svelte';
  import { ArrowDown } from '@lucide/svelte';
  import { useT } from '../../i18n/state.svelte.js';
  import { announce } from '../../utils/announce.js';
  import Progress from '../Progress/Progress.svelte';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  const t = useT();

  type Status = 'idle' | 'running' | 'done' | 'error';

  /**
   * LiveList: a list that fills while rows stream in (SSE, WebSocket, a bulk job).
   *
   * - Screen readers: the list is a named `role="log"` region with `aria-live="off"`, so each
   *   row is NOT read out. New rows are summarised as one polite message per batch
   *   ("12 new items"), and completion / failure is announced once.
   * - Scrolling: follows the newest row only while the user is at the bottom. Scrolling up
   *   pauses it; a "N new" button jumps back and resumes. It never calls `focus()`, so it
   *   cannot steal focus from a row action, a field outside, or the jump button itself.
   * - Progress: determinate when `total` is known ("3 of 12"), a plain count otherwise.
   *
   * Usage:
   *   <LiveList items={rows} total={domains.length} status={running ? 'running' : 'done'} label="Checks">
   *     {#snippet item(row)}<span>{row.domain}</span><StatusChip …/>{/snippet}
   *   </LiveList>
   */
  interface Props {
    /** Rows received so far, oldest first. Append to it (or replace it with a longer copy). */
    items: readonly T[];
    /** One row. Rendered inside an `<li>`. */
    item: Snippet<[T, number]>;
    /** Stable key per row. Defaults to the index (rows are append-only). */
    getKey?: (item: T, index: number) => string | number;
    /** Expected number of rows. Enables determinate progress. */
    total?: number;
    /** `running` shows progress and keeps following; `done` / `error` are announced once. */
    status?: Status;
    /** Accessible name of the log region (required: it is a landmark-like region). */
    label: string;
    /** Follow the newest row while the user is at the bottom. Turn off to never auto-scroll. */
    follow?: boolean;
    /** Height of the scrolling area (any CSS length). */
    height?: string;
    /** Quiet period before a batch of new rows is announced, in ms. */
    announceDelay?: number;
    /** Shown while there are no rows. Defaults to a localised "Waiting for results…". */
    empty?: Snippet;
    class?: string;
  }

  let {
    items,
    item,
    getKey = (_item: T, i: number) => i,
    total,
    status = 'idle',
    label,
    follow = true,
    height = '24rem',
    announceDelay = 600,
    empty,
    class: className = '',
  }: Props = $props();

  /** Distance from the bottom, in px, that still counts as "at the bottom". */
  const STICK = 24;

  let scroller = $state<HTMLElement | null>(null);
  let atBottom = $state(true);
  /** Rows that arrived while following was paused. */
  let unseen = $state(0);
  // Rows present at mount are not "new": no announcement, no unseen badge.
  let lastCount = untrack(() => items.length);
  let announced = lastCount;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const count = $derived(items.length);
  const done = $derived(total !== undefined ? Math.min(count, total) : count);
  const progressLabel = $derived(
    total !== undefined ? t().liveList.progress(done, total) : t().liveList.count(count)
  );

  function nearBottom(el: HTMLElement) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= STICK;
  }

  function onscroll() {
    if (!scroller) return;
    atBottom = nearBottom(scroller);
    if (atBottom) unseen = 0;
  }

  function toBottom() {
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;
    atBottom = true;
    unseen = 0;
  }

  // New rows: follow or count them as unseen, and queue one announcement for the batch.
  $effect(() => {
    const n = count;
    untrack(() => {
      const added = n - lastCount;
      lastCount = n;
      if (added <= 0) return;
      if (follow && atBottom) {
        // After the DOM has the new rows. Re-check at the frame: the user may have scrolled up since.
        queueMicrotask(toBottom);
        requestAnimationFrame(() => {
          if (atBottom) toBottom();
        });
      } else {
        unseen += added;
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        const batch = lastCount - announced;
        announced = lastCount;
        if (batch > 0) announce(t().liveList.received(batch));
      }, announceDelay);
    });
  });

  // Completion / failure: announced once per transition, after pending batch text.
  let lastStatus: Status = untrack(() => status);
  $effect(() => {
    const s = status;
    untrack(() => {
      if (s === lastStatus) return;
      lastStatus = s;
      if (s === 'done') announce(t().liveList.complete(count));
      else if (s === 'error') announce(t().liveList.failed, 'assertive');
    });
  });


  onDestroy(() => clearTimeout(timer));
</script>

<div class="ca-live-list {className}" data-status={status}>
  <div class="ca-live-list__head">
    <span class="ca-live-list__count">{progressLabel}</span>
    {#if status === 'running' && total === undefined}
      <Progress indeterminate label={label} class="ca-live-list__bar" />
    {:else if total !== undefined}
      <Progress value={done} max={Math.max(total, 1)} label={label} class="ca-live-list__bar" />
    {/if}
  </div>

  <div class="ca-live-list__frame">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={scroller}
      class="ca-live-list__scroller"
      role="log"
      aria-label={label}
      aria-live="off"
      aria-busy={status === 'running'}
      style="--ca-live-list-h:{height}"
      {onscroll}
      use:scrollFocusable
    >
      {#if count === 0}
        <div class="ca-live-list__empty">
          {#if empty}{@render empty()}{:else}{t().liveList.empty}{/if}
        </div>
      {:else}
        <ul class="ca-live-list__list">
          {#each items as row, i (getKey(row, i))}
            <li class="ca-live-list__item">{@render item(row, i)}</li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if unseen > 0}
      <button type="button" class="ca-live-list__jump" onclick={toBottom}>
        <ArrowDown size={14} stroke-width={2} aria-hidden="true" />
        {t().liveList.newItems(unseen)}
      </button>
    {/if}
  </div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-live-list {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
      min-width: 0;
    }

    .ca-live-list__head {
      display: flex;
      align-items: center;
      gap: var(--ca-space-3);
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
    }

    .ca-live-list__count { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .ca-live-list__head :global(.ca-live-list__bar) { flex: 1; }

    .ca-live-list__frame { position: relative; }

    .ca-live-list__scroller {
      height: var(--ca-live-list-h);
      overflow-y: auto;
      overscroll-behavior: contain;
      /* Keep the viewport still when rows are added above it; never fight the user's scroll. */
      overflow-anchor: auto;
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-lg);
    }

    .ca-live-list__list { list-style: none; margin: 0; padding: 0; }

    .ca-live-list__item {
      display: flex;
      align-items: center;
      gap: var(--ca-space-3);
      padding: var(--ca-space-2) var(--ca-space-4);
      border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
    }
    .ca-live-list__item:last-child { border-bottom: none; }

    .ca-live-list__empty {
      display: grid;
      place-items: center;
      height: 100%;
      padding: var(--ca-space-6);
      color: var(--ca-text-secondary);
      font-size: var(--ca-font-size-body2);
    }

    .ca-live-list__jump {
      position: absolute;
      inset-block-end: var(--ca-space-3);
      inset-inline-start: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-1);
      padding: var(--ca-space-1-5) var(--ca-space-3);
      border: none;
      border-radius: var(--ca-radius-pill);
      background: var(--ca-brand-fill);
      color: var(--ca-brand-contrast);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-semibold);
      box-shadow: var(--ca-shadow-md);
      cursor: pointer;
    }

    @media (pointer: coarse) {
      .ca-live-list__jump { min-height: var(--ca-touch-target); }
    }
}
</style>

<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { ChevronDown } from '@lucide/svelte';
  import type { DocsHeading } from './types.js';

  /**
   * TableOfContents: "On this page" index with scrollspy.
   *
   * `variant="rail"` (desktop, sticky column) lists every heading.
   * `variant="inline"` (phones/tablets) is a collapsible disclosure that shows the current
   * section in its summary, so the reader always knows where they are.
   * Renders nothing for pages with fewer than 2 headings.
   */
  interface Props {
    headings: DocsHeading[];
    label?: string;
    variant?: 'rail' | 'inline';
    class?: string;
  }

  let { headings, label, variant = 'rail', class: className = '' }: Props = $props();

  let active = $state<string | null>(null);
  let details = $state<HTMLDetailsElement | null>(null);

  const activeHeading = $derived(headings.find((h) => h.id === active) ?? headings[0]);

  // The active heading is the last one that crossed the top fifth of the viewport.
  $effect(() => {
    const els = headings.flatMap((h) => document.getElementById(h.id) ?? []);
    active = els[0]?.id ?? null;
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = e.target.id;
      },
      { rootMargin: '-72px 0px -78% 0px' }
    );
    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  });

  function pick() {
    if (details) details.open = false;
  }
</script>

{#snippet list()}
  <ul class="ca-toc__list">
    {#each headings as h (h.id)}
      <li class:ca-toc__sub={h.depth === 3}>
        <a href="#{h.id}" aria-current={active === h.id ? 'location' : undefined} onclick={pick}>{h.text}</a>
      </li>
    {/each}
  </ul>
{/snippet}

{#if headings.length > 1}
  {#if variant === 'inline'}
    <details class="ca-toc ca-toc--inline {className}" bind:this={details}>
      <summary>
        <span class="ca-toc__summary-label">{label ?? t().docs.toc}</span>
        <span class="ca-toc__current">{activeHeading?.text}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <nav aria-label={label ?? t().docs.toc}>{@render list()}</nav>
    </details>
  {:else}
    <nav class="ca-toc ca-toc--rail {className}" aria-label={label ?? t().docs.toc}>
      <p class="ca-toc__label">{label ?? t().docs.toc}</p>
      {@render list()}
    </nav>
  {/if}
{/if}

<style>
  .ca-toc__label {
    margin: 0 0 0.75rem;
    font-size: var(--ca-font-size-caption);
    font-weight: 600;
    color: var(--ca-text-primary);
  }

  .ca-toc__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ca-toc a {
    display: block;
    padding: 0.25rem 0 0.25rem 0.875rem;
    font-size: var(--ca-font-size-caption);
    line-height: 1.5;
    color: var(--ca-text-secondary);
    text-decoration: none;
    transition: color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-toc a:hover { color: var(--ca-text-primary); }

  .ca-toc a:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
    border-radius: var(--ca-radius-xs);
  }

  .ca-toc a[aria-current='location'] { color: var(--ca-brand-text); }

  .ca-toc__sub a { padding-left: 1.75rem; }

  /* Rail: a thin guide line with the active item marked in brand. */
  .ca-toc--rail { padding: 1.5rem 0 3rem; }

  .ca-toc--rail .ca-toc__list { border-left: 1px solid var(--ca-outline-subtle); }

  .ca-toc--rail a {
    margin-left: -1px;
    border-left: 1px solid transparent;
  }

  .ca-toc--rail a[aria-current='location'] { border-left-color: var(--ca-brand-main); }

  /* Inline: disclosure card. 44px summary target, current section visible while collapsed. */
  .ca-toc--inline {
    margin: 0 0 1.5rem;
    border: 1px solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
  }

  .ca-toc--inline summary {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 44px;
    padding: 0 0.875rem;
    cursor: pointer;
    list-style: none;
    font-size: var(--ca-font-size-body2);
  }

  .ca-toc--inline summary::-webkit-details-marker { display: none; }

  .ca-toc--inline summary:focus-visible {
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
    border-radius: var(--ca-radius-lg);
  }

  .ca-toc__summary-label {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--ca-text-primary);
  }

  .ca-toc__current {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ca-text-secondary);
  }

  .ca-toc--inline summary :global(svg) {
    flex-shrink: 0;
    color: var(--ca-text-hint);
    transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-toc--inline[open] summary :global(svg) { transform: rotate(180deg); }

  .ca-toc--inline[open] summary { border-bottom: 1px solid var(--ca-outline-subtle); }

  .ca-toc--inline nav {
    max-height: min(calc(var(--ca-vh) * 0.5), 22rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.5rem 0.25rem;
  }

  .ca-toc--inline a {
    display: flex;
    align-items: center;
    min-height: 40px;
    padding: 0 0.625rem;
    border-radius: var(--ca-radius-sm);
  }

  .ca-toc--inline .ca-toc__sub a { padding-left: 1.5rem; }

  @media (prefers-reduced-motion: reduce) {
    .ca-toc a,
    .ca-toc--inline summary :global(svg) { transition: none; }
  }
</style>

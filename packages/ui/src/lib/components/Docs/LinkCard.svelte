<script lang="ts">
  import { ArrowRight } from '@lucide/svelte';

  /** LinkCard: whole-card link with title, optional description and arrow. Min height 44px. */
  interface Props {
    title: string;
    description?: string;
    href: string;
  }

  let { title, description, href }: Props = $props();
</script>

<a class="ca-link-card" {href}>
  <span class="ca-link-card__title">{title}<ArrowRight size={16} aria-hidden="true" /></span>
  {#if description}<span class="ca-link-card__desc">{description}</span>{/if}
</a>

<style>
  .ca-link-card {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1-5);
    min-height: var(--ca-touch-target);
    padding: var(--ca-space-4) var(--ca-space-5);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-raised);
    text-decoration: none;
    transition:
      border-color var(--ca-duration-fast) var(--ca-ease-standard),
      transform var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-link-card:hover { border-color: var(--ca-brand-main); }
  .ca-link-card:active { transform: scale(0.995); }

  .ca-link-card:focus-visible {
    outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
    outline-offset: var(--ca-focus-ring-offset);
  }

  .ca-link-card__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-primary);
  }

  .ca-link-card__title :global(svg) {
    flex-shrink: 0;
    color: var(--ca-text-hint);
    transition:
      transform var(--ca-duration-fast) var(--ca-ease-standard),
      color var(--ca-duration-fast) var(--ca-ease-standard);
  }

  .ca-link-card:hover .ca-link-card__title :global(svg) {
    color: var(--ca-brand-text);
    transform: translateX(var(--ca-space-0-5));
  }

  .ca-link-card__desc {
    font-size: var(--ca-font-size-body2);
    font-weight: var(--ca-font-weight-regular);
    line-height: var(--ca-line-height-body);
    color: var(--ca-text-secondary);
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-link-card,
    .ca-link-card__title :global(svg) { transition: none; transform: none; }
  }
</style>

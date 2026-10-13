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
    gap: 0.375rem;
    min-height: 44px;
    padding: 1.125rem 1.25rem;
    border: 1px solid var(--ca-outline-subtle);
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
    outline: 2px solid var(--ca-brand-main);
    outline-offset: 2px;
  }

  .ca-link-card__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-weight: 600;
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
    transform: translateX(2px);
  }

  .ca-link-card__desc {
    font-size: var(--ca-font-size-body2);
    font-weight: 400;
    line-height: 1.55;
    color: var(--ca-text-secondary);
  }

  @media (prefers-reduced-motion: reduce) {
    .ca-link-card,
    .ca-link-card__title :global(svg) { transition: none; transform: none; }
  }
</style>

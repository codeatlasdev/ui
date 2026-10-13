<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { IconComponent } from '../../types.js';

  interface Props {
    /** Lucide icon component */
    icon?:        IconComponent;
    title:        string;
    /**
     * 'default' = compact inline empty state.
     * 'hero'    = larger brand-tinted icon tile with glow, bigger title; `actions` stack
     *             full-width on mobile (put the primary action first).
     */
    variant?:     'default' | 'hero';
    description?: string;
    actions?:     Snippet;
    class?:       string;
    children?:    Snippet;
  }

  let { icon: Icon, title, variant = 'default', description, actions, children, class: className = '' }: Props = $props();
</script>

<div class="ca-empty ca-empty--{variant} {className}" role="status" aria-label={title}>
  {#if Icon}
    <div class="ca-empty__icon" aria-hidden="true">
      <Icon size={variant === 'hero' ? 32 : 24} stroke-width={1.5} />
    </div>
  {/if}
  <h5 class="ca-empty__title">{title}</h5>
  {#if description}
    <p class="ca-empty__description">{description}</p>
  {:else if children}
    <p class="ca-empty__description">{@render children()}</p>
  {/if}
  {#if actions}
    <div class="ca-empty__actions">{@render actions()}</div>
  {/if}
</div>

<style>
  .ca-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    padding: 48px 24px;
  }

  .ca-empty__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--ca-radius-lg);
    background: var(--ca-action-hover);
    color: var(--ca-text-secondary);
    flex-shrink: 0;
  }

  .ca-empty__title {
    font-size: var(--ca-font-size-body1);
    font-weight: 600;
    color: var(--ca-text-primary);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .ca-empty__description {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    margin: 0;
    max-width: 340px;
    line-height: 1.55;
  }

  .ca-empty__actions {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 4px;
  }

  /* ── Hero ──────────────────────────────────────────────────── */
  .ca-empty--hero {
    gap: 8px;
    padding: 56px 24px;
  }

  .ca-empty--hero .ca-empty__icon {
    position: relative;
    isolation: isolate;
    width: 72px;
    height: 72px;
    margin-bottom: 12px;
    border-radius: var(--ca-radius-xl);
    background: color-mix(in oklab, var(--ca-brand-main) 14%, var(--ca-surface-raised));
    border: 1px solid color-mix(in oklab, var(--ca-brand-main) 28%, transparent);
    color: var(--ca-brand-text);
  }

  /* Soft brand glow behind the tile. */
  .ca-empty--hero .ca-empty__icon::before {
    content: '';
    position: absolute;
    inset: -28px;
    z-index: -1;
    border-radius: 50%;
    background: radial-gradient(closest-side, color-mix(in oklab, var(--ca-brand-main) 34%, transparent), transparent);
    filter: blur(8px);
    pointer-events: none;
  }

  .ca-empty--hero .ca-empty__title {
    font-size: var(--ca-font-size-h6);
    font-weight: 700;
    letter-spacing: -0.015em;
  }

  .ca-empty--hero .ca-empty__description {
    max-width: 360px;
  }

  .ca-empty--hero .ca-empty__actions {
    margin-top: 16px;
  }

  @media (max-width: 599.98px) {
    .ca-empty--hero {
      width: 100%;
      padding-inline: 20px;
    }
    .ca-empty--hero .ca-empty__actions {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      max-width: 360px;
    }
    .ca-empty--hero .ca-empty__actions > :global(*) {
      width: 100%;
    }
  }
</style>

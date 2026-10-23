<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * AuthCard: authentication form card.
   *
   * Usage:
   *   <AuthCard title="Welcome back" subtitle="Sign in to continue">
   *     <TextField … />
   *     {#snippet footer()}
   *       Already have an account? <a href="/sign-in">Sign in</a>
   *     {/snippet}
   *   </AuthCard>
   */

  interface Props {
    /**
     * `plain` drops the card width cap and sets `title` at display size, for a
     * left-aligned form (`AuthLayout align="start"`). Default `card`.
     */
    variant?:  'card' | 'plain';
    title?:    string;
    subtitle?: string;
    /** Display text role for the title: `--ca-display-tracking`, `--ca-display-leading` and the fluid `--ca-font-size-display-3`. */
    display?:  boolean;
    /** Content below the form: links, terms, etc. */
    footer?:   Snippet;
    children?: Snippet;
  }

  let { variant = 'card', title, subtitle, display = false, footer, children }: Props = $props();
</script>

<div class="ca-auth-card" class:ca-auth-card--plain={variant === 'plain'}>
  {#if title || subtitle}
    <div class="ca-auth-card__header">
      {#if title}<h1 class="ca-auth-card__title" class:ca-auth-card__title--display={display}>{title}</h1>{/if}
      {#if subtitle}<p class="ca-auth-card__subtitle">{subtitle}</p>{/if}
    </div>
  {/if}

  <div class="ca-auth-card__body">
    {@render children?.()}
  </div>

  {#if footer}
    <div class="ca-auth-card__footer">
      {@render footer()}
    </div>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-auth-card {
      width: 100%;
      max-width: calc(var(--ca-space-unit) * 100);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-6);
    }

    /* Plain: no width cap beyond a form column, display-size title, start-aligned footer. */
    .ca-auth-card--plain { max-width: calc(var(--ca-space-unit) * 105); }
    .ca-auth-card--plain .ca-auth-card__title {
      font-size: var(--ca-font-size-display-3);
      line-height: var(--ca-line-height-tight);
    }
    .ca-auth-card--plain .ca-auth-card__footer { text-align: start; }

    .ca-auth-card__header {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
    }

    .ca-auth-card__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-xl);
      font-weight: var(--ca-font-weight-heading);
      color: var(--ca-text-primary);
      margin: 0;
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      line-height: var(--ca-line-height-tight);
    }

    .ca-auth-card__title--display {
      font-size: var(--ca-font-size-display-3);
      letter-spacing: var(--ca-display-tracking);
      line-height: var(--ca-display-leading);
    }

    .ca-auth-card__subtitle {
      font-size: var(--ca-font-size-button);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-relaxed);
    }

    .ca-auth-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-3-5);
    }

    .ca-auth-card__footer {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      text-align: center;
    }

    .ca-auth-card__footer :global(a) {
      color: var(--ca-brand-text);
      font-weight: var(--ca-font-weight-medium);
      text-decoration: none;
    }

    .ca-auth-card__footer :global(a:hover) {
      text-decoration: underline;
      text-underline-offset: var(--ca-space-0-5);
    }

    /* ── Shared auth utility classes, available inside any AuthCard ── */
    :global(.pass-btn) {
      display: flex; align-items: center;
      background: transparent; border: none; padding: 0;
      color: var(--ca-text-hint); cursor: pointer; line-height: 0;
      border-radius: var(--ca-radius-sm);
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    :global(.pass-btn:hover) { color: var(--ca-text-primary); }

    :global(.auth-link) { color: var(--ca-brand-text); text-decoration: none; font-weight: var(--ca-font-weight-medium); }
    :global(.auth-link--sm) { font-size: var(--ca-font-size-caption); font-weight: var(--ca-font-weight-regular); }
    :global(.auth-link:hover) { text-decoration: underline; }

    :global(.auth-or) {
      display: flex; align-items: center; gap: var(--ca-space-3);
      color: var(--ca-text-hint);
      font-size: var(--ca-font-size-micro); font-weight: var(--ca-font-weight-medium); letter-spacing: var(--ca-overline-tracking);
    }
    :global(.auth-or::before), :global(.auth-or::after) {
      content: ''; flex: 1; height: var(--ca-border-width); background: var(--ca-outline-subtle);
    }

    :global(.auth-error) { font-size: var(--ca-font-size-body2); color: var(--ca-semantic-error); margin: 0; }
}
</style>

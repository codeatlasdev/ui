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
    title?:    string;
    subtitle?: string;
    /** Content below the form: links, terms, etc. */
    footer?:   Snippet;
    children?: Snippet;
  }

  let { title, subtitle, footer, children }: Props = $props();
</script>

<div class="ca-auth-card">
  {#if title || subtitle}
    <div class="ca-auth-card__header">
      {#if title}<h1 class="ca-auth-card__title">{title}</h1>{/if}
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
  .ca-auth-card {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .ca-auth-card__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ca-auth-card__title {
    font-size: var(--ca-font-size-xl);
    font-weight: 600;
    color: var(--ca-text-primary);
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .ca-auth-card__subtitle {
    font-size: var(--ca-font-size-button);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .ca-auth-card__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ca-auth-card__footer {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    text-align: center;
  }

  .ca-auth-card__footer :global(a) {
    color: var(--ca-brand-text);
    font-weight: 500;
    text-decoration: none;
  }

  .ca-auth-card__footer :global(a:hover) {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── Shared auth utility classes, available inside any AuthCard ── */
  :global(.pass-btn) {
    display: flex; align-items: center;
    background: transparent; border: none; padding: 0;
    color: var(--ca-text-hint); cursor: pointer; line-height: 0;
    border-radius: var(--ca-radius-sm);
    transition: color var(--ca-duration-fast);
  }
  :global(.pass-btn:hover) { color: var(--ca-text-primary); }

  :global(.auth-link) { color: var(--ca-brand-text); text-decoration: none; font-weight: 500; }
  :global(.auth-link--sm) { font-size: var(--ca-font-size-caption); font-weight: 400; }
  :global(.auth-link:hover) { text-decoration: underline; }

  :global(.auth-or) {
    display: flex; align-items: center; gap: 12px;
    color: var(--ca-text-hint);
    font-size: var(--ca-font-size-micro); font-weight: 500; letter-spacing: 0.08em;
  }
  :global(.auth-or::before), :global(.auth-or::after) {
    content: ''; flex: 1; height: 1px; background: var(--ca-outline-subtle);
  }

  :global(.auth-error) { font-size: var(--ca-font-size-body2); color: var(--ca-semantic-error); margin: 0; }
</style>

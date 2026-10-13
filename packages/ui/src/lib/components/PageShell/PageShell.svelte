<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    gap?: number;
    maxWidth?: string;
    actions?: Snippet;
    class?: string;
    children?: Snippet;
  }

  let { title, description, gap = 28, maxWidth = '1280px', actions, class: className = '', children }: Props = $props();
</script>

<div class="ca-page-shell {className}" style="--ps-max:{maxWidth};--ps-gap:{gap}px">
  {#if title || description || actions}
    <div class="ca-page-shell__header">
      <div class="ca-page-shell__meta">
        {#if title}
          <h1 class="ca-page-shell__title">{title}</h1>
        {/if}
        {#if description}
          <p class="ca-page-shell__description">{description}</p>
        {/if}
      </div>
      {#if actions}
        <div class="ca-page-shell__actions">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}
  <div class="ca-page-shell__body">
    {@render children?.()}
  </div>
</div>

<style>
  .ca-page-shell {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    max-width: var(--ps-max, 1280px);
    width: 100%;
    margin: 0 auto;
    padding: var(--ca-page-pt, 20px) var(--ca-page-px, 24px) var(--ca-space-12, 48px);
    box-sizing: border-box;
  }

  .ca-page-shell__header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ca-space-4, 16px);
    margin-bottom: var(--ps-gap, 28px);
  }

  .ca-page-shell__meta { flex: 1; min-width: 0; }

  .ca-page-shell__title {
    font-size: var(--ca-font-size-h5);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ca-text-primary);
    margin: 0 0 2px;
    line-height: 1.2;
  }

  .ca-page-shell__description {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .ca-page-shell__actions {
    display: flex;
    align-items: center;
    gap: var(--ca-space-2, 8px);
    flex-shrink: 0;
  }

  .ca-page-shell__body {
    display: flex;
    flex-direction: column;
    gap: var(--ps-gap, 28px);
    width: 100%;
  }

  @media (max-width: 599.98px) {
    .ca-page-shell {
      padding: var(--ca-space-5, 20px) var(--ca-page-px-sm, 16px) var(--ca-space-10, 40px);
    }
  }

  /* Inside AppShellLayout the mobile header (< 900px) already shows the page title:
     keep the h1 for assistive tech and the document outline, hide it visually. */
  @media (max-width: 899.98px) {
    :global(.ca-shell__content) .ca-page-shell__title {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  }

  /* Mobile: description leads, actions wrap below it full-width. */
  @media (max-width: 899.98px) {
    .ca-page-shell__header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--ca-space-3, 12px);
    }
    .ca-page-shell__actions {
      flex-shrink: 1;
      flex-wrap: wrap;
      width: 100%;
    }
    .ca-page-shell__actions > :global(*) {
      flex: 1 1 auto;
    }
  }
</style>

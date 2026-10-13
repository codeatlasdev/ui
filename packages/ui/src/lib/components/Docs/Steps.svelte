<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Steps: wraps a markdown ordered list; each top-level item becomes a numbered
   * step on a vertical rail.
   *
   *   <Steps>
   *
   *   1. **Create a session**
   *   2. **Connect via QR code**
   *
   *   </Steps>
   */
  let { children }: { children?: Snippet } = $props();
</script>

<div class="ca-steps">
  {@render children?.()}
</div>

<style>
  .ca-steps :global(> ol) {
    margin: 1.5rem 0;
    padding: 0;
    list-style: none;
    counter-reset: ca-step;
  }

  .ca-steps :global(> ol > li) {
    position: relative;
    margin: 0;
    padding: 0 0 2rem 2.75rem;
    counter-increment: ca-step;
    min-width: 0;
  }

  .ca-steps :global(> ol > li::before) {
    content: counter(ca-step);
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: color-mix(in oklab, var(--ca-brand-main) 14%, var(--ca-surface-base));
    color: var(--ca-brand-text);
    font: 700 var(--ca-font-size-caption) / 1 var(--ca-font-mono);
  }

  .ca-steps :global(> ol > li::after) {
    content: '';
    position: absolute;
    top: 2.25rem;
    bottom: 0.5rem;
    left: calc(0.875rem - 0.5px);
    width: 1px;
    background: var(--ca-outline-default);
  }

  .ca-steps :global(> ol > li:last-child) { padding-bottom: 0; }
  .ca-steps :global(> ol > li:last-child::after) { display: none; }
  .ca-steps :global(> ol > li > :first-child) { margin-top: 0; }

  @media (max-width: 767px) {
    .ca-steps :global(> ol > li) { padding-left: 2.5rem; }
  }
</style>

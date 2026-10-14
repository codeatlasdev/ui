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
    margin: var(--ca-space-6) 0;
    padding: 0;
    list-style: none;
    counter-reset: ca-step;
  }

  .ca-steps :global(> ol > li) {
    position: relative;
    margin: 0;
    padding: 0 0 var(--ca-space-8) var(--ca-space-10);
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
    width: var(--ca-space-7);
    height: var(--ca-space-7);
    border-radius: 50%;
    background: color-mix(in oklab, var(--ca-brand-main) 14%, var(--ca-surface-base));
    color: var(--ca-brand-text);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-bold);
    line-height: 1;
  }

  .ca-steps :global(> ol > li::after) {
    content: '';
    position: absolute;
    top: calc(var(--ca-space-7) + var(--ca-space-2));
    bottom: var(--ca-space-2);
    left: calc(var(--ca-space-3-5) - var(--ca-border-width) / 2);
    width: var(--ca-border-width);
    background: var(--ca-outline-default);
  }

  .ca-steps :global(> ol > li:last-child) { padding-bottom: 0; }
  .ca-steps :global(> ol > li:last-child::after) { display: none; }
  .ca-steps :global(> ol > li > :first-child) { margin-top: 0; }
  /* A leading inline title (<strong>, <b>) shares its line with the li's own strut (regular
     face + whitespace), and that mixed line rounds to 23.2 or 24.2px between loads, shifting
     everything below by 1px per step. As a block, the title's line measures one font only. */
  .ca-steps :global(> ol > li > :is(strong, b):first-child) { display: block; }
</style>

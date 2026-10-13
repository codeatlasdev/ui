<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLTableAttributes } from 'svelte/elements';

  let { class: className = '', children, ...rest }: HTMLTableAttributes & { children?: Snippet } = $props();
</script>

<!--
  Wraps <table> in the glass container: all DataTable rows/cells render inside here.
  The glass border + backdrop are applied on the outer div so they don't
  interfere with table layout.
-->
<div class="ca-table-root {className}">
  <div class="ca-table-container">
    <table class="ca-table" {...rest}>{@render children?.()}</table>
  </div>
</div>

<style>
  .ca-table-root {
    min-height: 0;
    flex: 1;
    overflow: auto;
    border-radius: var(--ca-radius-lg);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    background: var(--ca-surface-raised);
  }

  .ca-table-container {
    width: 100%;
    overflow-x: auto;
  }

  .ca-table {
    width: 100%;
    border-collapse: collapse;
    caption-side: bottom;
    font-size: var(--ca-font-size-body2);
  }

  /* thead / tbody / tr / th / td are styled globally so DataTable
     sub-components can use plain HTML elements without extra classes */
  :global(.ca-table thead) {
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
  }

  :global(.ca-table tbody tr:last-child) {
    border-bottom: none;
  }

  :global(.ca-table tbody tr) {
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-table tbody tr:hover) {
    background: var(--ca-action-hover);
  }

  :global(.ca-table th) {
    height: var(--ca-control-height);
    padding: 0 var(--ca-space-3);
    text-align: left;
    vertical-align: middle;
    font-size: var(--ca-font-size-caption);
    font-weight: var(--ca-font-weight-semibold);
    color: var(--ca-text-hint);
    text-transform: uppercase;
    letter-spacing: var(--ca-overline-tracking);
    white-space: nowrap;
  }

  :global(.ca-table td) {
    padding: var(--ca-space-2-5) var(--ca-space-3);
    vertical-align: middle;
    white-space: nowrap;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
  }
</style>

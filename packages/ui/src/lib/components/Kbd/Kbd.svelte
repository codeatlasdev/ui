<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<kbd class="ca-kbd {className}">{@render children?.()}</kbd>

<style>
  .ca-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--ca-space-0-5) var(--ca-space-1-5);
    border-radius: var(--ca-radius-xs);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-bottom-width: var(--ca-border-width-strong);
    background: color-mix(in oklab, var(--ca-text-primary) 6%, transparent);
    font-family: var(--ca-font-mono);
    font-size: var(--ca-font-size-micro);
    color: var(--ca-text-secondary);
    line-height: var(--ca-line-height-snug);
    white-space: nowrap;
    user-select: none;
  }
</style>

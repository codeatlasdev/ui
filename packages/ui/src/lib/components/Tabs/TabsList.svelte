<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<Tabs.List class="ca-tabs-list {className}">
  {@render children?.()}
</Tabs.List>

<style>
  :global(.ca-tabs-list) {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: var(--ca-space-0-5);
    padding: var(--ca-space-1);
    border-radius: var(--ca-radius-pill);
    background: var(--ca-glass-tint-ultra-thin);
    -webkit-backdrop-filter: var(--ca-blur-ultra-thin);
    backdrop-filter: var(--ca-blur-ultra-thin);
    border: var(--ca-border-width) solid var(--ca-glass-border);
  }
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs } from 'bits-ui';

  interface Props {
    value: string;
    class?: string;
    children?: Snippet;
  }

  let { value, class: className = '', children }: Props = $props();
</script>

<Tabs.Content {value} class="ca-tabs-content {className}">
  {@render children?.()}
</Tabs.Content>

<style>
  :global(.ca-tabs-content) {
    flex: 1;
    outline: none;
  }

  :global(.ca-tabs-content:focus-visible) {
    outline: var(--ca-border-width-focus) solid var(--ca-brand-main);
    outline-offset: var(--ca-border-width-focus);
    border-radius: var(--ca-radius-sm);
  }
</style>

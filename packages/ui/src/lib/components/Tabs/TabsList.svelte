<script lang="ts">
  import type { Snippet } from 'svelte';
  import { rovingFocus } from '../../primitives/index.js';
  import { getTabsContext } from './tabs-context.js';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();

  const tabs = getTabsContext();

  // Arrow keys / Home / End move focus among enabled tabs; focus selects (automatic activation,
  // handled by each trigger's onfocus).
  function roving(node: HTMLElement) {
    return rovingFocus(node, { selector: '.ca-tabs-trigger', orientation: 'horizontal' });
  }
</script>

<div
  role="tablist"
  id={tabs.ids.part('list')}
  aria-orientation="horizontal"
  data-orientation="horizontal"
  class="ca-tabs-list {className}"
  {@attach roving}
>
  {@render children?.()}
</div>

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

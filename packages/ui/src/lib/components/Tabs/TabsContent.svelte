<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getTabsContext, idKey } from './tabs-context.js';

  interface Props {
    value: string;
    class?: string;
    children?: Snippet;
  }

  let { value, class: className = '', children }: Props = $props();

  const tabs = getTabsContext();
  const active = $derived(tabs.value === value);
</script>

<div
  role="tabpanel"
  id={tabs.ids.item('panel', idKey(value))}
  aria-labelledby={tabs.ids.item('tab', idKey(value))}
  tabindex="0"
  hidden={!active}
  data-state={active ? 'active' : 'inactive'}
  data-value={value}
  data-orientation="horizontal"
  class="ca-tabs-content {className}"
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tabs-content) {
      flex: 1;
      outline: none;
    }

    :global(.ca-tabs-content:focus-visible) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-border-width-focus);
      border-radius: var(--ca-radius-sm);
    }
}
</style>

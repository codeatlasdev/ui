<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createIds, setTabsContext } from './tabs-context.js';

  interface Props {
    value?:    string;
    onchange?: (v: string) => void;
    class?:    string;
    children?: Snippet;
  }

  let { value = $bindable(), onchange, class: className = '', children }: Props = $props();

  const base = $props.id();
  const ids = createIds(base);

  setTabsContext({
    ids,
    get value() {
      return value;
    },
    select(next) {
      if (value === next) return;
      value = next;
      onchange?.(next);
    },
  });
</script>

<div class="ca-tabs {className}" data-orientation="horizontal">
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tabs) {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
}
</style>

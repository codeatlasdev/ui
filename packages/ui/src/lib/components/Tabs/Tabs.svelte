<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { createIds, setTabsContext, type TabsVariant } from './tabs-context.js';

  interface Props {
    value?:    string;
    onchange?: (v: string) => void;
    /** `pill` fills the active tab on a glass list; `line` underlines it on a bare list (page headers). */
    variant?:  TabsVariant;
    class?:    string;
    children?: Snippet;
  }

  let { value = $bindable(), onchange, variant = 'pill', class: className = '', children }: Props = $props();

  const base = $props.id();
  const ids = createIds(base);
  // Panels mounted per value (counted: a value may briefly have two during a keyed swap).
  const panels = new SvelteMap<string, number>();

  setTabsContext({
    ids,
    get value() {
      return value;
    },
    get variant() {
      return variant;
    },
    hasPanel: (v) => panels.has(v),
    // Called from TabsContent's $effect: read-modify-write untracked, or the effect would depend
    // on the map it writes and loop (effect_update_depth_exceeded).
    registerPanel(v) {
      untrack(() => panels.set(v, (panels.get(v) ?? 0) + 1));
      return () =>
        untrack(() => {
          const n = (panels.get(v) ?? 1) - 1;
          if (n > 0) panels.set(v, n);
          else panels.delete(v);
        });
    },
    select(next) {
      if (value === next) return;
      value = next;
      onchange?.(next);
    },
  });
</script>

<div class="ca-tabs {className}" data-orientation="horizontal" data-variant={variant}>
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

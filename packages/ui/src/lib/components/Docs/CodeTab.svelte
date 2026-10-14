<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getCodeTabsContext } from './CodeTabs.svelte';

  /** CodeTab: one language panel inside CodeTabs. `label` is the tab text and the sync key ("Node.js", "cURL"). */
  let { label, children }: { label: string; children?: Snippet } = $props();

  const ctx = getCodeTabsContext();
  // Labels are static per tab; registering once at init is intended.
  // svelte-ignore state_referenced_locally
  const index = ctx.register(label);
</script>

<div
  class="ca-codetab"
  role="tabpanel"
  id="{ctx.id}-panel-{index}"
  aria-labelledby="{ctx.id}-tab-{index}"
  data-index={index}
  hidden={ctx.active !== index}
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-codetab[hidden] { display: none; }
}
</style>

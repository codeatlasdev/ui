<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setChartScope, type ChartScopeRef } from './tokens.js';

  /**
   * ChartScope: tells every chart below it which element holds its theme tokens.
   *
   * Charts are canvas, so they read tokens with `getComputedStyle` instead of the cascade. Without a
   * scope they read `<html>`, which is wrong inside a `data-theme-scope` / `data-preset` island: the
   * chart would paint the page's colors. Wrap the island's content in this and its charts follow it.
   * `ThemeIsland` already does.
   */
  interface Props {
    /** The element to read tokens from. Omit to use the wrapper div this component renders. */
    scope?: HTMLElement | null;
    class?: string;
    children?: Snippet;
  }
  let { scope = null, class: className = '', children }: Props = $props();

  let host = $state<HTMLElement | null>(null);
  const ref: ChartScopeRef = $state({ el: null });
  // `display: contents` has no box but still inherits: its computed style is the island's.
  $effect(() => {
    ref.el = scope ?? host;
  });
  setChartScope(ref);
</script>

<div bind:this={host} class="ca-chart-scope {className}">{@render children?.()}</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-chart-scope) { display: contents; }
}
</style>

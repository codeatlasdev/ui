<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children }: Props = $props();
</script>

<div class="ca-dropdown-label {className}">
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-dropdown-label {
      padding: var(--ca-space-1) var(--ca-space-3) var(--ca-space-0-5);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-hint);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
    }
}
</style>

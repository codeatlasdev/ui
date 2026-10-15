<script lang="ts" generics="T extends ElementTag = 'div'">
  /**
   * Box — the base layout element. Renders any element (`as`) with the token props
   * (`p`, `px`, `py`) as `data-*` attributes: no inline style. Everything else is forwarded.
   *
   *   <Box as="section" p={{ base: '3', md: '6' }}>…</Box>
   */
  import type { Snippet } from 'svelte';
  import { layoutAttrs, type ElementTag, type LayoutProps, type PolymorphicAttributes } from '../Layout/layout.js';

  type Props = {
    /** Element to render (default `div`). Its own attributes and event types become valid props. */
    as?: T;
    class?: string;
    children?: Snippet;
  } & PolymorphicAttributes<T, Pick<LayoutProps, 'p' | 'px' | 'py'>>;

  let { as = 'div' as T, p, px, py, class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element this={as} class="ca-box {className}" {...rest} {...layoutAttrs({ p, px, py })}>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-box { box-sizing: border-box; }
}
</style>

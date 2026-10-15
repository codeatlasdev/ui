<script lang="ts" generics="T extends ElementTag = 'div'">
  /**
   * Flex — flex container. Token props become `data-*` attributes (no inline style); a
   * responsive object like `{ base: 'column', md: 'row' }` switches at the shared breakpoints.
   *
   *   <Flex gap="3" align="center" justify="between" wrap>…</Flex>
   */
  import type { Snippet } from 'svelte';
  import { layoutAttrs, type ElementTag, type LayoutProps, type PolymorphicAttributes } from '../Layout/layout.js';

  type Props = {
    /** Element to render (default `div`). Its own attributes and event types become valid props. */
    as?: T;
    class?: string;
    children?: Snippet;
  } & PolymorphicAttributes<T, Pick<LayoutProps, 'gap' | 'p' | 'px' | 'py' | 'align' | 'justify' | 'direction' | 'wrap'>>;

  let {
    as = 'div' as T,
    gap, p, px, py, align, justify, direction, wrap,
    class: className = '',
    children,
    ...rest
  }: Props = $props();
</script>

<svelte:element
  this={as}
  class="ca-flex {className}"
  {...rest}
  {...layoutAttrs({ gap, p, px, py, align, justify, direction, wrap })}
>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Direction comes from [data-direction] (utilities layer); `row` is the CSS default. */
    .ca-flex { display: flex; box-sizing: border-box; }
}
</style>

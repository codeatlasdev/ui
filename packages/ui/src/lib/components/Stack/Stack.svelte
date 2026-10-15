<script lang="ts" generics="T extends ElementTag = 'div'">
  /**
   * Stack — vertical flex layout (a Flex column). Token props are `data-*` attributes, no inline style.
   *
   *   <Stack gap="4">…</Stack>
   *   <Stack as="ul" gap={{ base: '2', md: '4' }} align="center">…</Stack>
   */
  import type { Snippet } from 'svelte';
  import { layoutAttrs, type ElementTag, type LayoutProps, type PolymorphicAttributes } from '../Layout/layout.js';

  type Props = {
    /** Element to render (default `div`). Its own attributes and event types become valid props. */
    as?: T;
    class?: string;
    children?: Snippet;
  } & PolymorphicAttributes<T, Pick<LayoutProps, 'gap' | 'p' | 'px' | 'py' | 'align' | 'justify'>>;

  let { as = 'div' as T, gap, p, px, py, align, justify, class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  class="ca-stack {className}"
  {...rest}
  {...layoutAttrs({ gap, p, px, py, align, justify })}
>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-stack { display: flex; flex-direction: column; box-sizing: border-box; }
}
</style>

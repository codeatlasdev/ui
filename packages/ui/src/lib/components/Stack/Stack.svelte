<script lang="ts">
  /**
   * Stack — vertical flex layout (a Flex column). Token props are `data-*` attributes, no inline style.
   *
   *   <Stack gap="4">…</Stack>
   *   <Stack as="ul" gap={{ base: '2', md: '4' }} align="center">…</Stack>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props
    extends Omit<HTMLAttributes<HTMLElement>, 'class'>,
      Pick<LayoutProps, 'gap' | 'p' | 'px' | 'py' | 'align' | 'justify'> {
    /** Element to render. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { as = 'div', gap, p, px, py, align, justify, class: className = '', children, ...rest }: Props = $props();
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

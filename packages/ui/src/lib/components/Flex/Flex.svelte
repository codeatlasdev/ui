<script lang="ts">
  /**
   * Flex — flex container. Token props become `data-*` attributes (no inline style); a
   * responsive object like `{ base: 'column', md: 'row' }` switches at the shared breakpoints.
   *
   *   <Flex gap="3" align="center" justify="between" wrap>…</Flex>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props
    extends Omit<HTMLAttributes<HTMLElement>, 'class'>,
      Pick<LayoutProps, 'gap' | 'p' | 'px' | 'py' | 'align' | 'justify' | 'direction' | 'wrap'> {
    /** Element to render. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    as = 'div',
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

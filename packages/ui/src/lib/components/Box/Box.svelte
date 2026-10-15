<script lang="ts">
  /**
   * Box — the base layout element. Renders any element (`as`) with the token props
   * (`p`, `px`, `py`) as `data-*` attributes: no inline style. Everything else is forwarded.
   *
   *   <Box as="section" p={{ base: '3', md: '6' }}>…</Box>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class'>, Pick<LayoutProps, 'p' | 'px' | 'py'> {
    /** Element to render. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { as = 'div', p, px, py, class: className = '', children, ...rest }: Props = $props();
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

<script lang="ts" generics="T extends ElementTag = 'div'">
  /**
   * Grid — CSS grid with equal tracks. `columns` is 1–12 or a responsive object; gap, padding and
   * alignment are token props. All render as `data-*` attributes (no inline style). For an
   * arbitrary `grid-template-columns` (`2fr 1fr`, `repeat(auto-fill, minmax(200px, 1fr))`) add a
   * class and write the template there.
   *
   *   <Grid columns={{ base: 1, md: 3 }} gap="4">…</Grid>
   */
  import { layoutAttrs, type ElementTag, type LayoutProps, type PolymorphicProps } from '../Layout/layout.js';

  type Props = PolymorphicProps<T, Pick<LayoutProps, 'columns' | 'gap' | 'p' | 'px' | 'py' | 'align'>>;

  let { as = 'div' as T, columns, gap, p, px, py, align, class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  class="ca-grid {className}"
  {...rest}
  {...layoutAttrs({ columns, gap, p, px, py, align })}
>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-grid { display: grid; box-sizing: border-box; width: 100%; }
}
</style>

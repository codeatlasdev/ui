<script lang="ts">
  /**
   * Section — a page band with the fluid vertical rhythm (`--ca-section-gap`). A real `<section>`:
   * give it an accessible name (`aria-labelledby`) when it is a landmark worth navigating to.
   *
   *   <Section size="2" aria-labelledby="pricing">…</Section>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class'>, Pick<LayoutProps, 'px' | 'py'> {
    /** Vertical padding: 1 compact, 2 default (the section rhythm), 3 airy. A `py` token overrides it. */
    size?: '1' | '2' | '3';
    /** Element to render. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { as = 'section', size = '2', px, py, class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  class="ca-layout-section {className}"
  data-size={size}
  {...rest}
  {...layoutAttrs({ px, py })}
>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-layout-section { box-sizing: border-box; }
    /* The page rhythm is the default; a py token (layer ca.utilities, which this layer outranks) replaces it. */
    .ca-layout-section:not([data-py], [data-sm-py], [data-md-py], [data-lg-py], [data-xl-py]) {
      padding-block: var(--ca-section-gap);
    }
    .ca-layout-section[data-size="1"]:not([data-py], [data-sm-py], [data-md-py], [data-lg-py], [data-xl-py]) {
      padding-block: calc(var(--ca-section-gap) / 2);
    }
    .ca-layout-section[data-size="3"]:not([data-py], [data-sm-py], [data-md-py], [data-lg-py], [data-xl-py]) {
      padding-block: calc(var(--ca-section-gap) * 1.5);
    }
}
</style>

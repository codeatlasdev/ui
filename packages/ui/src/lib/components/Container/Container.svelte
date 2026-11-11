<script lang="ts">
  /**
   * Container — centered, width-capped column with the fluid page gutter.
   *
   *   <Container size="md"><Section>…</Section></Container>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class'>, Pick<LayoutProps, 'px' | 'py'> {
    /**
     * Max width. `default` (= `lg`) is `--ca-content-max` (76rem); `wide` (= `xl`) is
     * `--ca-content-max-wide` (90rem); `full` fills the viewport up to `--ca-content-max-full`
     * (120rem), so a very wide screen still gets a centred column. PageShell caps at its own
     * `--ca-page-max` (80rem) and the App* pages fill their area.
     * `sm` 40rem and `md` 56rem are the narrow reading sizes.
     */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'default' | 'wide' | 'full';
    /** Element to render. */
    as?: string;
    class?: string;
    children?: Snippet;
  }

  let { as = 'div', size = 'lg', px, py, class: className = '', children, ...rest }: Props = $props();
</script>

<svelte:element
  this={as}
  class="ca-container {className}"
  data-size={size}
  {...rest}
  {...layoutAttrs({ px, py })}
>
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-container {
      box-sizing: border-box;
      width: 100%;
      margin-inline: auto;
      max-width: var(--ca-container-max, var(--ca-content-max));
    }
    /* The fluid gutter is the default; a px token (layer ca.utilities, which this layer outranks) replaces it. */
    .ca-container:not([data-px], [data-sm-px], [data-md-px], [data-lg-px], [data-xl-px]) {
      padding-inline: var(--ca-gutter);
    }
    .ca-container[data-size="sm"] { --ca-container-max: 40rem; }
    .ca-container[data-size="md"] { --ca-container-max: 56rem; }
    .ca-container[data-size="lg"],
    .ca-container[data-size="default"] { --ca-container-max: var(--ca-content-max); }
    .ca-container[data-size="xl"],
    .ca-container[data-size="wide"] { --ca-container-max: var(--ca-content-max-wide, 90rem); }
    .ca-container[data-size="full"] { --ca-container-max: var(--ca-content-max-full, 120rem); }
}
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Heading: a native `<h1>`-`<h6>` whose look is picked by `size`, independent of the level.
   * `size="display"` is the display text role: `--ca-font-display` (the body font until the
   * theme sets `fonts.display`), `--ca-display-tracking`, `--ca-display-leading` and the fluid
   * `--ca-font-size-display-*` tokens.
   *
   *   <Heading level={1} size="display">Ship the interface</Heading>
   */
  type Size = 'display' | 'display-2' | 'display-3' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  interface Props {
    /** Heading element, 1-6. Only the tag changes: never the look. */
    level?:    1 | 2 | 3 | 4 | 5 | 6;
    /** Visual size. `display` (alias of `display-1`), `display-2` and `display-3` are the fluid editorial tier. Defaults to the size of the level. */
    size?:     Size;
    class?:    string;
    children?: Snippet;
  }

  let { level = 2, size, class: className = '', children }: Props = $props();
  const look = $derived(size ?? `h${level}`);
</script>

<svelte:element this={`h${level}`} class="ca-heading ca-heading--{look} {className}">
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-heading {
      margin: 0;
      color: var(--ca-text-primary);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      line-height: var(--ca-line-height-tight);
      text-wrap: balance;
    }
    .ca-heading--h1 { font-size: var(--ca-font-size-h1); }
    .ca-heading--h2 { font-size: var(--ca-font-size-h2); }
    .ca-heading--h3 { font-size: var(--ca-font-size-h3); }
    .ca-heading--h4 { font-size: var(--ca-font-size-h4); }
    .ca-heading--h5 { font-size: var(--ca-font-size-h5); }
    .ca-heading--h6 { font-size: var(--ca-font-size-h6); }

    .ca-heading--display,
    .ca-heading--display-2,
    .ca-heading--display-3 {
      letter-spacing: var(--ca-display-tracking);
      line-height: var(--ca-display-leading);
    }
    .ca-heading--display   { font-size: var(--ca-font-size-display-1); }
    .ca-heading--display-2 { font-size: var(--ca-font-size-display-2); }
    .ca-heading--display-3 { font-size: var(--ca-font-size-display-3); }
}
</style>

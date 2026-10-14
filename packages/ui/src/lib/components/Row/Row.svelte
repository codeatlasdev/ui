<script lang="ts">
  /**
   * Row — horizontal flex layout primitive.
   *
   * Uso:
   *   <Row gap={8} align="center">…</Row>
   *   <Row gap={12} justify="space-between" wrap>…</Row>
   */
  import type { Snippet } from 'svelte';

  interface Props {
    gap?:     number | string;
    align?:   string;
    justify?: string;
    wrap?:    boolean;
    class?:   string;
    children?: Snippet;
  }

  let { gap = 0, align, justify, wrap = false, class: className = '', children }: Props = $props();

  const gapPx = (v: number | string) => typeof v === 'number' ? `${v}px` : v;

  const cssVars = $derived([
    gap     ? `--r-gap:${gapPx(gap)}`      : '',
    align   ? `--r-align:${align}`          : '',
    justify ? `--r-justify:${justify}`      : '',
  ].filter(Boolean).join(';'));
</script>

<div
  class="ca-row {className}"
  class:ca-row--wrap={wrap}
  style={cssVars || undefined}
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-row {
      display: flex;
      flex-direction: row;
      gap:             var(--r-gap, 0);
      align-items:     var(--r-align, flex-start);
      justify-content: var(--r-justify, flex-start);
    }

    .ca-row--wrap {
      flex-wrap: wrap;
    }
}
</style>

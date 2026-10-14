<script lang="ts">
  /**
   * Stack — vertical flex layout primitive.
   *
   * Uso:
   *   <Stack gap={16}>…</Stack>
   *   <Stack gap={8} align="center">…</Stack>
   */
  import type { Snippet } from 'svelte';

  interface Props {
    gap?:     number | string;
    align?:   string;
    justify?: string;
    class?:   string;
    children?: Snippet;
  }

  let { gap = 0, align, justify, class: className = '', children }: Props = $props();

  const gapPx = (v: number | string) => typeof v === 'number' ? `${v}px` : v;

  const cssVars = $derived([
    gap     ? `--s-gap:${gapPx(gap)}`      : '',
    align   ? `--s-align:${align}`          : '',
    justify ? `--s-justify:${justify}`      : '',
  ].filter(Boolean).join(';'));
</script>

<div class="ca-stack {className}" style={cssVars || undefined}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-stack {
      display: flex;
      flex-direction: column;
      gap:             var(--s-gap, 0);
      align-items:     var(--s-align, stretch);
      justify-content: var(--s-justify, flex-start);
    }
}
</style>

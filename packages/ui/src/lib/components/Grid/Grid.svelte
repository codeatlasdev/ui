<script lang="ts">
  /**
   * Grid — CSS grid layout primitive.
   *
   * Uso:
   *   <Grid cols={3} gap={16}>…</Grid>
   *   <Grid cols="2fr 1fr" gap={20}>…</Grid>
   *   <Grid cols="repeat(auto-fill, minmax(200px, 1fr))" gap={16}>…</Grid>
   *
   * Props:
   *   cols    — number (equal cols) | CSS grid-template-columns string
   *   gap     — number (px) | CSS gap string
   *   rowGap  — override row gap only
   *   colGap  — override column gap only
   *   align   — align-items value
   *   justify — justify-items value
   */
  import type { Snippet } from 'svelte';

  interface Props {
    cols?:    number | string;
    gap?:     number | string;
    rowGap?:  number | string;
    colGap?:  number | string;
    align?:   string;
    justify?: string;
    class?:   string;
    children?: Snippet;
  }

  let {
    cols,
    gap = 0,
    rowGap,
    colGap,
    align,
    justify,
    class: className = '',
    children,
  }: Props = $props();

  const colsValue = $derived(
    cols === undefined ? 'none'
    : typeof cols === 'number' ? `repeat(${cols}, 1fr)`
    : cols
  );

  const gapPx  = (v: number | string) => typeof v === 'number' ? `${v}px` : v;

  const cssVars = $derived([
    `--g-cols:${colsValue}`,
    gap     ? `--g-gap:${gapPx(gap)}`      : '',
    rowGap  ? `--g-row-gap:${gapPx(rowGap)}` : '',
    colGap  ? `--g-col-gap:${gapPx(colGap)}` : '',
    align   ? `--g-align:${align}`           : '',
    justify ? `--g-justify:${justify}`        : '',
  ].filter(Boolean).join(';'));
</script>

<div class="ca-grid {className}" style={cssVars || undefined}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-grid {
      display: grid;
      grid-template-columns: var(--g-cols, none);
      gap:             var(--g-gap, 0);
      row-gap:         var(--g-row-gap, var(--g-gap, 0));
      column-gap:      var(--g-col-gap, var(--g-gap, 0));
      align-items:     var(--g-align, stretch);
      justify-items:   var(--g-justify, stretch);
      width: 100%;
    }
}
</style>

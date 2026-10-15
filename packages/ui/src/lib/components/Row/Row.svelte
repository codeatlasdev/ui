<script lang="ts">
  /**
   * @deprecated Use `<Flex>`: `<Row gap={8} align="center">` is `<Flex gap="2" align="center">` (the
   * gap is a spacing step, 8px = step 2). Removed in the next major; `bunx @codeatlasdev/ui migrate
   * --write` rewrites usages.
   *
   *   <Row gap={8} align="center">…</Row>
   */
  import type { Snippet } from 'svelte';
  import Flex from '../Flex/Flex.svelte';
  import { type Align, type Justify, type Space, SPACE } from '../Layout/layout.js';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props {
    /** Pixels (a multiple of 2px on the spacing scale: 8 → step 2) or a spacing step string. */
    gap?:     number | Space;
    align?:   string;
    justify?: string;
    wrap?:    boolean;
    class?:   string;
    children?: Snippet;
  }

  let { gap, align, justify, wrap = false, class: className = '', children }: Props = $props();

  $effect.pre(() => {
    devWarn('row', '<Row> is deprecated and removed in the next major. Use <Flex> (direction defaults to row; gap is a spacing step: gap={8} → gap="2"); `bunx @codeatlasdev/ui migrate --write` rewrites usages.');
  });

  // Row used to default to flex-start alignment; Flex leaves it to the browser (stretch).
  const FLEX: Record<string, Align | undefined> = { 'flex-start': 'start', start: 'start', 'flex-end': 'end', end: 'end', center: 'center', stretch: 'stretch', baseline: 'baseline' };
  const JUSTIFY: Record<string, Justify | undefined> = { 'flex-start': 'start', start: 'start', 'flex-end': 'end', end: 'end', center: 'center', 'space-between': 'between', 'space-around': 'around', 'space-evenly': 'evenly' };

  // A pixel gap becomes the step of the same size (px / 4); one off the scale is dropped, with a warning.
  const step = $derived.by(() => {
    if (gap === undefined) return undefined;
    const n = typeof gap === 'number' ? gap / 4 : Number(gap);
    if (SPACE.includes(n as (typeof SPACE)[number])) return String(n) as Space;
    devWarn(`row-gap-${gap}`, `<Row gap=${JSON.stringify(gap)}> is not on the spacing scale and is ignored. Use <Flex> with a spacing step, or a class for a one-off gap.`);
    return undefined;
  });
</script>

<Flex
  direction="row"
  gap={step}
  align={(align && FLEX[align]) || 'start'}
  justify={justify ? JUSTIFY[justify] : undefined}
  {wrap}
  class="ca-row{wrap ? ' ca-row--wrap' : ''} {className}"
>
  {@render children?.()}
</Flex>

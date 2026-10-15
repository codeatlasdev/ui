<script lang="ts">
  /**
   * @deprecated Use `<Surface>`. `thickness` is `elevation` (ultra-thin 1, thin 2, regular 3, thick 4,
   * chrome 5), `tinted` is `tone="brand"`, `glowing` is `glow`, `refraction` is `material="liquid"`.
   * Removed in the next major; `bunx @codeatlasdev/ui migrate --write` rewrites usages.
   */
  import type { Snippet } from 'svelte';
  import type { Thickness } from '../../tokens/materials.js';
  import Surface from '../Surface/Surface.svelte';
  import LiquidGlass from '../LiquidGlass/LiquidGlass.svelte';
  import { GLASS_OPTICS } from '../../tokens/materials.js';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props {
    thickness?: Thickness;
    tinted?: boolean;
    glowing?: boolean;
    refraction?: boolean;
    class?: string;
    style?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    thickness = 'regular',
    tinted = false,
    glowing = false,
    refraction = true,
    class: className = '',
    style = '',
    children,
    ...rest
  }: Props = $props();

  $effect.pre(() => {
    devWarn('glass-surface', '<GlassSurface> is deprecated and removed in the next major. Use <Surface> (thickness → elevation, tinted → tone="brand", glowing → glow, refraction → material="liquid"); `bunx @codeatlasdev/ui migrate --write` rewrites usages.');
  });

  const ELEVATION = { 'ultra-thin': 1, thin: 2, regular: 3, thick: 4, chrome: 5 } as const;

  // The legacy classes stay on the element: apps target them until the major.
  let cls = $derived(
    `glass glass-${thickness}${tinted ? ' glass-tinted' : ''}${glowing ? ' glass-glow' : ''} ${className}`
  );
</script>

<Surface elevation={ELEVATION[thickness]} class={cls} {style} {...rest}>
  {#if refraction}
    <LiquidGlass optics={GLASS_OPTICS[thickness]} />
  {/if}
  {@render children?.()}
</Surface>

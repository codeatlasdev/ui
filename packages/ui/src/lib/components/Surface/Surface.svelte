<script lang="ts">
  /**
   * Surface — the one painted container every card, panel and sheet is built on. Its axes are
   * orthogonal: `elevation` (shadow + depth), `material` (what it is made of), `tone`, `variant`,
   * `radius`. Each one is a `data-*` attribute read by a single `.ca-surface` rule (no inline style).
   *
   * `material="auto"` follows the theme (`<html data-style>`: glass blurs, solid is opaque...). The
   * explicit materials look the same under every style, so one surface can be glass in a solid app.
   *
   *   <Surface elevation={2} tone="brand" p="4">…</Surface>
   *   <Surface as="section" material="glass" elevation={4} interactive>…</Surface>
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import LiquidGlass from '../LiquidGlass/LiquidGlass.svelte';
  import { GLASS_OPTICS, type Thickness } from '../../tokens/materials.js';
  import { layoutAttrs, type LayoutProps } from '../Layout/layout.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class'>, Pick<LayoutProps, 'p' | 'px' | 'py'> {
    /** Element to render. Cards with an `href` render `a` through `Card`. */
    as?: string;
    /** Depth 0–5: drop shadow, and the blur/fill tier of the material (0 flat, 3 regular, 5 chrome). */
    elevation?: 0 | 1 | 2 | 3 | 4 | 5;
    /** `auto` follows `<html data-style>`; the others are absolute. `liquid` adds the SVG refraction layer. */
    material?: 'auto' | 'solid' | 'frosted' | 'glass' | 'liquid';
    /** Semantic tint over the fill (and the outline color of `variant="outlined"`). */
    tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
    /** `filled` (default), `outlined` (edge, no fill) or `ghost` (no fill, no edge). */
    variant?: 'filled' | 'outlined' | 'ghost';
    /** Corner radius; omit for the large radius. */
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';
    /** Hover, press and focus-visible states and a pointer cursor. Give it a role and a name if it is not a link or button. */
    interactive?: boolean;
    /** Brand halo behind the surface. */
    glow?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    as = 'div',
    elevation = 1,
    material = 'auto',
    tone = 'neutral',
    variant = 'filled',
    radius,
    interactive = false,
    glow = false,
    p, px, py,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const TIER: Thickness[] = ['ultra-thin', 'ultra-thin', 'thin', 'regular', 'thick', 'chrome'];
</script>

<svelte:element
  this={as}
  class="ca-surface {className}"
  data-elevation={elevation}
  data-material={material}
  data-tone={tone}
  data-variant={variant}
  data-radius={radius}
  data-interactive={interactive ? '' : undefined}
  data-glow={glow ? '' : undefined}
  {...rest}
  {...layoutAttrs({ p, px, py })}
>
  {#if material === 'liquid'}
    <LiquidGlass optics={GLASS_OPTICS[TIER[elevation]]} />
  {/if}
  {@render children?.()}
</svelte:element>

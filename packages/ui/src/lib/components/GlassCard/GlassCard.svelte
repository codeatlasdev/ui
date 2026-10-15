<script lang="ts">
  /**
   * @deprecated Use `<Card>`. `thickness` is `elevation` (ultra-thin 1, thin 2, regular 3, thick 4,
   * chrome 5), `tinted` is `tone="brand"`, `glowing` is `glow`. Removed in the next major;
   * `bunx @codeatlasdev/ui migrate --write` rewrites usages.
   */
  import type { Snippet } from 'svelte';
  import type { Thickness } from '../../tokens/materials.js';
  import type { HeadingLevel } from '../../types.js';
  import Card from '../Card/Card.svelte';
  import LiquidGlass from '../LiquidGlass/LiquidGlass.svelte';
  import { GLASS_OPTICS } from '../../tokens/materials.js';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props {
    thickness?:     Thickness;
    tinted?:        boolean;
    glowing?:       boolean;
    href?:          string;
    target?:        string;
    /**
     * Padding override. Omit to use `--ca-card-padding` (default 20px).
     * Passed as a CSS custom property, not as a fixed inline value.
     */
    padding?:       string | number;
    /** Removes all padding, for tables, images and code that touch the edges. */
    flush?:         boolean;
    /** width: 100% */
    full?:          boolean;
    title?:         string;
    /**
     * Renders `title` as an `<h2>`–`<h6>` so the card is a section in the page outline.
     * Omit for a plain paragraph. Only the tag changes, never the look.
     */
    headingLevel?:  HeadingLevel;
    headerActions?: Snippet;
    class?:         string;
    children?:      Snippet;
  }

  let {
    thickness = 'regular',
    tinted = false,
    glowing = false,
    href, target,
    padding,
    flush = false,
    full  = false,
    title,
    headingLevel,
    headerActions,
    class: className = '',
    children,
  }: Props = $props();

  $effect.pre(() => {
    devWarn('glass-card', '<GlassCard> is deprecated and removed in the next major. Use <Card> (thickness → elevation, tinted → tone="brand", glowing → glow); `bunx @codeatlasdev/ui migrate --write` rewrites usages.');
  });

  const ELEVATION = { 'ultra-thin': 1, thin: 2, regular: 3, thick: 4, chrome: 5 } as const;

  // Passes padding as a CSS custom property, not as a fixed inline value.
  // flush and full are applied via classes.
  const paddingVar = $derived(
    flush ? undefined
    : padding !== undefined
      ? `--ca-card-padding:${typeof padding === 'number' ? padding + 'px' : padding}`
      : undefined
  );

  // The legacy classes stay on the element: apps target them until the major.
  const cls = $derived([
    'glass',
    `glass-${thickness}`,
    'ca-glass-card',
    tinted  ? 'glass-tinted' : '',
    glowing ? 'glass-glow'   : '',
    flush   ? 'ca-glass-card--flush' : '',
    full    ? 'ca-glass-card--full'  : '',
    className,
  ].filter(Boolean).join(' '));
</script>

<!-- Same look as GlassCard had: material follows the theme, elevation is the old thickness tier. -->
<Card {href} {target} elevation={ELEVATION[thickness]} class={cls} style={paddingVar}>
  <LiquidGlass optics={GLASS_OPTICS[thickness]} />
  {#if title || headerActions}
    <div class="ca-glass-card__header">
      {#if title}
        <svelte:element this={headingLevel ? `h${headingLevel}` : 'p'} class="ca-glass-card__title">{title}</svelte:element>
      {/if}
      {#if headerActions}
        <div class="ca-glass-card__header-actions">{@render headerActions()}</div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</Card>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-glass-card) {
      border-radius: var(--ca-radius-lg);
      overflow: hidden;
      padding: var(--ca-card-padding);
      position: relative;
    }

    :global(.ca-glass-card--flush) { padding: 0; }
    :global(.ca-glass-card--full)  { width: 100%; }

    .ca-glass-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ca-space-4) var(--ca-space-5) 0;
      gap: var(--ca-space-3);
    }

    .ca-glass-card__title {
      margin: 0 0 var(--ca-space-4);
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-tight);
    }

    .ca-glass-card__header-actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
      margin-bottom: var(--ca-space-4);
    }
}
</style>

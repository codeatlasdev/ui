<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Thickness } from '../../tokens/materials.js';
  import LiquidGlass from '../LiquidGlass/LiquidGlass.svelte';
  import { GLASS_OPTICS } from '../../tokens/materials.js';

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
    headerActions,
    class: className = '',
    children,
  }: Props = $props();

  // Passes padding as a CSS custom property, not as a fixed inline value.
  // flush and full are applied via classes.
  const paddingVar = $derived(
    flush ? undefined
    : padding !== undefined
      ? `--ca-card-padding:${typeof padding === 'number' ? padding + 'px' : padding}`
      : undefined
  );

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

{#snippet inner()}
  <LiquidGlass optics={GLASS_OPTICS[thickness]} />
  {#if title || headerActions}
    <div class="ca-glass-card__header">
      {#if title}<p class="ca-glass-card__title">{title}</p>{/if}
      {#if headerActions}
        <div class="ca-glass-card__header-actions">{@render headerActions()}</div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
{/snippet}

{#if href}
  <a {href} {target} class={cls} style={paddingVar}>{@render inner()}</a>
{:else}
  <div class={cls} style={paddingVar}>{@render inner()}</div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-glass-card {
      border-radius: var(--ca-radius-lg);
      overflow: hidden;
      padding: var(--ca-card-padding);
      position: relative;
    }

    .ca-glass-card--flush { padding: 0; }
    .ca-glass-card--full  { width: 100%; }

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

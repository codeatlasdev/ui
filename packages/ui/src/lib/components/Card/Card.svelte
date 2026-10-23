<script lang="ts">
  /**
   * Card — a Surface with a header (`title`, `headerActions`), padding and an optional link.
   * Every Surface prop (`elevation`, `material`, `tone`, `variant`, `radius`, `glow`) passes through.
   *
   *   <Card title="Revenue" headingLevel={2} elevation={2}>…</Card>
   *   <Card href="/docs" title="Docs" interactive>…</Card>
   *
   * The content is already padded (`--ca-card-padding`, 20px). Do not wrap it in a padded `<div>`:
   * the two add up to 40px. Use `padding` for another density, `flush` when you bring your own.
   */
  import type { Snippet } from 'svelte';
  import type { HeadingLevel } from '../../types.js';
  import Surface from '../Surface/Surface.svelte';
  import type { ComponentProps } from 'svelte';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props extends Omit<ComponentProps<typeof Surface>, 'as' | 'children'> {
    /** Renders the card as a link (an `<a>`, interactive). */
    href?: string;
    /** Link target. `_blank` also sets `rel="noopener noreferrer"`. */
    target?: string;
    /** Header title. */
    title?: string;
    /**
     * Renders `title` as `<h2>`–`<h6>` so the card is a section in the page outline.
     * Omit for a plain paragraph. Only the tag changes, never the look.
     */
    headingLevel?: HeadingLevel;
    /** Actions aligned to the end of the header. */
    headerActions?: Snippet;
    /**
     * Content padding: `'none'`, `'sm'` (12px), `'md'` (20px, the default), `'lg'` (32px), or any
     * CSS length (`'1.5rem'`) or number (px). It sets `--ca-card-padding` on this card only.
     * `flush` is the alias of `'none'` and wins over `padding`.
     */
    padding?: 'none' | 'sm' | 'md' | 'lg' | (string & {}) | number;
    /** Removes all padding, for tables, images and code that touch the edges. */
    flush?: boolean;
    /** `width: 100%`. */
    full?: boolean;
    /**
     * Stacks the children in a column with this spacing: `'sm'` (8px), `'md'` (16px), `'lg'` (24px),
     * or any CSS length / number (px). Omit for normal flow. Without it several inline controls
     * (Checkbox, Switch, TextField) sit side by side with no space between them.
     */
    gap?: 'sm' | 'md' | 'lg' | (string & {}) | number;
    /** Loading placeholder: same size as the loaded card (content keeps its layout, hidden), announced as busy. */
    skeleton?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    href, target,
    title,
    headingLevel,
    headerActions,
    padding,
    flush = false,
    full = false,
    gap,
    skeleton = false,
    class: className = '',
    style,
    children,
    ...rest
  }: Props = $props();

  const STEPS = ['none', 'sm', 'md', 'lg'];
  const step = $derived(typeof padding === 'string' && STEPS.includes(padding) ? padding : undefined);
  const custom = $derived(
    flush || padding === undefined || step !== undefined ? undefined : typeof padding === 'number' ? `${padding}px` : padding
  );
  const GAPS = ['sm', 'md', 'lg'];
  const gapStep = $derived(typeof gap === 'string' && GAPS.includes(gap) ? gap : undefined);
  const gapCustom = $derived(
    gap === undefined || gapStep !== undefined ? undefined : typeof gap === 'number' ? `${gap}px` : gap
  );
  // The only inline style is the custom properties: the values are the consumer's, there is no class for them.
  const styleAttr = $derived(
    [custom ? `--ca-card-padding:${custom}` : '', gapCustom ? `--ca-card-gap:${gapCustom}` : '', style]
      .filter(Boolean)
      .join(';') || undefined
  );

  const cls = $derived(
    ['ca-card', flush ? 'ca-card--flush' : '', full ? 'ca-card--full' : '', className]
      .filter(Boolean)
      .join(' ')
  );
  // A padded wrapper inside the padded card doubles the space (20px + 20px). Check the real
  // computed padding once, in dev only: devWarn is a no-op in production builds.
  function checkDoublePadding(el: HTMLElement) {
    if (flush || step === 'none') return;
    const child = el.querySelector(':scope > :not(.ca-card__header):not(.ca-liquid-glass)');
    if (!child) return;
    const cs = getComputedStyle(child);
    if (parseFloat(cs.paddingInlineStart) > 0 || parseFloat(cs.paddingBlockStart) > 0)
      devWarn(
        'card-double-padding',
        '<Card> content is already padded (--ca-card-padding), and its first child adds its own padding on top. Remove the wrapper padding, or use `flush` / `padding="none"` when you bring your own layout.'
      );
  }
  const link = $derived(
    href ? { href, target, rel: target === '_blank' ? 'noopener noreferrer' : undefined } : {}
  );
</script>

<Surface
  as={href ? 'a' : 'div'}
  interactive={href ? true : undefined}
  {...rest}
  {...link}
  class={cls}
  style={styleAttr}
  data-padding={flush ? undefined : step}
  data-gap={gap === undefined ? undefined : (gapStep ?? 'custom')}
  {@attach checkDoublePadding}
  data-skeleton={skeleton ? '' : undefined}
  aria-busy={skeleton ? 'true' : undefined}
>
  {#if title || headerActions}
    <div class="ca-card__header">
      {#if title}
        <svelte:element this={headingLevel ? `h${headingLevel}` : 'p'} class="ca-card__title">{title}</svelte:element>
      {/if}
      {#if headerActions}
        <div class="ca-card__header-actions">{@render headerActions()}</div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</Surface>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-card) {
      overflow: hidden;
      padding: var(--ca-card-padding);
    }

    :global(.ca-card[data-padding='none']) { padding: 0; }
    :global(.ca-card[data-padding='sm'])   { padding: var(--ca-space-3); }
    :global(.ca-card[data-padding='md'])   { padding: var(--ca-space-5); }
    :global(.ca-card[data-padding='lg'])   { padding: var(--ca-space-8); }
    :global(.ca-card--flush) { padding: 0; }
    :global(.ca-card--full)  { width: 100%; }

    :global(.ca-card[data-gap]) {
      display: flex;
      flex-direction: column;
      gap: var(--ca-card-gap, var(--ca-space-4));
    }
    :global(.ca-card[data-gap='sm']) { gap: var(--ca-space-2); }
    :global(.ca-card[data-gap='md']) { gap: var(--ca-space-4); }
    :global(.ca-card[data-gap='lg']) { gap: var(--ca-space-6); }
    /* The stack's gap replaces the header's own bottom margin. */
    :global(.ca-card[data-gap]) .ca-card__title,
    :global(.ca-card[data-gap]) .ca-card__header-actions { margin-bottom: 0; }

    /* The card's own padding already insets the header. Only a card with no padding needs the inset. */
    .ca-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0;
      gap: var(--ca-space-3);
    }
    :global(.ca-card--flush) .ca-card__header,
    :global(.ca-card[data-padding='none']) .ca-card__header {
      padding: var(--ca-space-4) var(--ca-space-5) 0;
    }

    .ca-card__title {
      margin: 0 0 var(--ca-space-4);
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-heading);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-tight);
    }

    .ca-card__header-actions {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      flex-shrink: 0;
      margin-bottom: var(--ca-space-4);
    }
}
</style>

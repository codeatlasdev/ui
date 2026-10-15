<script lang="ts">
  /**
   * Card — a Surface with a header (`title`, `headerActions`), padding and an optional link.
   * Every Surface prop (`elevation`, `material`, `tone`, `variant`, `radius`, `glow`) passes through.
   *
   *   <Card title="Revenue" headingLevel={2} elevation={2}>…</Card>
   *   <Card href="/docs" title="Docs" interactive>…</Card>
   */
  import type { Snippet } from 'svelte';
  import type { HeadingLevel } from '../../types.js';
  import Surface from '../Surface/Surface.svelte';
  import type { ComponentProps } from 'svelte';

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
    /** Removes all padding, for tables, images and code that touch the edges. */
    flush?: boolean;
    /** `width: 100%`. */
    full?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    href, target,
    title,
    headingLevel,
    headerActions,
    flush = false,
    full = false,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const cls = $derived(
    ['ca-card', flush ? 'ca-card--flush' : '', full ? 'ca-card--full' : '', className]
      .filter(Boolean)
      .join(' ')
  );
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

    :global(.ca-card--flush) { padding: 0; }
    :global(.ca-card--full)  { width: 100%; }

    .ca-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ca-space-4) var(--ca-space-5) 0;
      gap: var(--ca-space-3);
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

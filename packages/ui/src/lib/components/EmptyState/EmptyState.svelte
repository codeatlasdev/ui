<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HeadingLevel, IconComponent } from '../../types.js';
  import { sectionHeadingLevel } from '../PageShell/heading-context.js';

  interface Props {
    /** Lucide icon component */
    icon?:        IconComponent;
    title:        string;
    /**
     * Heading level of the title (2–6). Only the tag changes, never the look.
     * Defaults to 2 inside a `PageShell` (under its `<h1>`), 5 elsewhere.
     */
    headingLevel?: HeadingLevel;
    /**
     * 'default' = compact inline empty state.
     * 'hero'    = larger brand-tinted icon tile with glow, bigger title; `actions` stack
     *             full-width on mobile (put the primary action first).
     */
    variant?:     'default' | 'hero';
    /**
     * 'default' = the stacked block.
     * 'row'     = one line (16px icon, text, actions) for an empty slot inside a list, a card or
     *             a grid of sibling cards. The title is text, not a heading; `variant`, `display`,
     *             `actionsFill` and `headingLevel` apply to the stacked block only.
     */
    size?:        'default' | 'row';
    description?: string;
    /** Display text role for the title: `--ca-display-tracking`, `--ca-display-leading` and the fluid `--ca-font-size-display-3`. */
    display?:     boolean;
    /** No padding: an empty state inside a Card, a table or a pane that already insets its content. */
    bare?:        boolean;
    /** Stacks `actions` full-width at every width (one wide button, an invite form). `variant="hero"` already does it in a narrow slot. */
    actionsFill?: boolean;
    actions?:     Snippet;
    class?:       string;
    children?:    Snippet;
  }

  let { icon: Icon, title, headingLevel, variant = 'default', size = 'default', description, display = false, bare = false, actionsFill = false, actions, children, class: className = '' }: Props = $props();

  // Read once at init: context lookups are only valid during component initialisation.
  const inheritedLevel = sectionHeadingLevel(5);
  const level = $derived(headingLevel ?? inheritedLevel);
  // #992: a row is a line of content in a list or a card, not a section: five empty rows must not
  // add five headings to the outline, so its title is a paragraph.
  const row = $derived(size === 'row');
  const modifier = $derived(row ? 'row' : variant);
  const iconSize = $derived(row ? 16 : variant === 'hero' ? 32 : 24);
</script>

<div class="ca-empty ca-empty--{modifier} {className}" class:ca-empty--bare={bare} class:ca-empty--fill={actionsFill && !row} role="status" aria-label={title}>
  {#if Icon}
    <div class="ca-empty__icon" aria-hidden="true">
      <Icon size={iconSize} stroke-width={row ? 2 : 1.5} />
    </div>
  {/if}
  <svelte:element this={row ? 'p' : `h${level}`} class="ca-empty__title" class:ca-empty__title--display={display && !row}>{title}</svelte:element>
  {#if description}
    <p class="ca-empty__description">{description}</p>
  {:else if children}
    <p class="ca-empty__description">{@render children()}</p>
  {/if}
  {#if actions}
    <div class="ca-empty__actions">{@render actions()}</div>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-empty {
      /* Inline-size containment drops the intrinsic width, so the root must fill its slot. */
      container-type: inline-size;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: var(--ca-space-3);
      padding: var(--ca-empty-padding, var(--ca-space-12) var(--ca-space-6));
    }

    .ca-empty__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-12);
      height: var(--ca-space-12);
      border-radius: var(--ca-empty-icon-radius, var(--ca-radius-lg));
      background: var(--ca-empty-icon-bg, var(--ca-action-hover));
      border: var(--ca-empty-icon-border, none);
      color: var(--ca-text-secondary);
      flex-shrink: 0;
    }

    .ca-empty__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-empty-title-size, var(--ca-font-size-body1));
      font-weight: var(--ca-empty-title-weight, var(--ca-font-weight-semibold));
      color: var(--ca-text-primary);
      margin: 0;
      line-height: var(--ca-empty-title-leading, revert-layer);
      letter-spacing: var(--ca-empty-title-tracking, var(--ca-heading-tracking));
      text-transform: var(--ca-heading-case);
    }

    .ca-empty__description {
      font-size: var(--ca-empty-description-size, var(--ca-font-size-body2));
      color: var(--ca-text-secondary);
      margin: 0;
      max-width: var(--ca-empty-description-max-width, calc(var(--ca-space-unit) * 85));
      line-height: var(--ca-empty-description-leading, var(--ca-line-height-body));
    }
    /* The title-to-description space alone (#707): the row gap is one value for every pair, so the description
       pulls itself up by the difference; unset, the margin is 0. */
    .ca-empty__title + .ca-empty__description {
      margin-top: calc(var(--ca-empty-title-gap, var(--ca-space-3)) - var(--ca-space-3));
    }

    .ca-empty__actions {
      display: flex;
      flex-direction: row;
      gap: var(--ca-space-2);
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: var(--ca-empty-actions-margin, var(--ca-space-1));
    }

    /* ── Hero ──────────────────────────────────────────────────── */
    .ca-empty--hero {
      gap: var(--ca-space-2);
      padding: var(--ca-empty-padding, calc(var(--ca-space-12) + var(--ca-space-2)) var(--ca-space-6));
    }

    .ca-empty--hero .ca-empty__icon {
      position: relative;
      isolation: isolate;
      width: calc(var(--ca-space-unit) * 18);
      height: calc(var(--ca-space-unit) * 18);
      margin-bottom: var(--ca-space-3);
      border-radius: var(--ca-radius-xl);
      background: color-mix(in oklab, var(--ca-brand-main) 14%, var(--ca-surface-raised));
      border: var(--ca-border-width) solid color-mix(in oklab, var(--ca-brand-main) 28%, transparent);
      color: var(--ca-brand-text);
    }

    /* Soft brand glow behind the tile. */
    .ca-empty--hero .ca-empty__icon::before {
      content: '';
      position: absolute;
      inset: calc(var(--ca-space-7) * -1);
      z-index: -1;
      border-radius: 50%;
      background: radial-gradient(closest-side, color-mix(in oklab, var(--ca-brand-main) 34%, transparent), transparent);
      filter: blur(var(--ca-space-2));
      pointer-events: none;
    }

    .ca-empty--hero .ca-empty__title {
      font-size: var(--ca-empty-title-size, var(--ca-font-size-h6));
      font-weight: var(--ca-empty-title-weight, var(--ca-font-weight-heading));
    }

    /* ── Row (#992) ──────────────────────────────────────────────
       One line for an empty slot in a list or a grid of siblings: icon, text and actions side by side,
       about one control high. It wraps instead of overflowing a narrow slot. The stacked tokens size a
       heading and a tile a row does not have, so it reads only --ca-empty-row-padding. */
    .ca-empty--row {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: flex-start;
      text-align: start;
      gap: var(--ca-space-1) var(--ca-space-2);
      padding: var(--ca-empty-row-padding, var(--ca-space-2) var(--ca-space-3));
    }

    .ca-empty--row .ca-empty__icon {
      width: auto;
      height: auto;
      background: none;
      border: none;
      border-radius: 0;
    }

    .ca-empty--row .ca-empty__title,
    .ca-empty--row .ca-empty__description {
      font-size: var(--ca-font-size-body2);
      line-height: var(--ca-line-height-body);
      max-width: none;
      min-width: 0;
    }

    .ca-empty--row .ca-empty__title {
      flex: 0 1 auto;
      font-family: inherit;
      font-weight: var(--ca-font-weight-medium);
      letter-spacing: normal;
      text-transform: none;
    }

    .ca-empty--row .ca-empty__description {
      flex: 1 1 auto;
    }

    .ca-empty--row .ca-empty__title + .ca-empty__description {
      margin-top: 0;
    }

    .ca-empty--row .ca-empty__actions {
      margin-block: 0;
      margin-inline-start: auto;
      justify-content: flex-end;
    }

    /* bare: no padding, whatever the variant or --ca-empty-padding (it follows the parent's inset). */
    .ca-empty.ca-empty--bare {
      padding: 0;
    }

    /* actionsFill: the actions stack, each full-width, at every width. */
    .ca-empty--fill .ca-empty__actions {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }
    .ca-empty--fill .ca-empty__actions > :global(*) {
      width: 100%;
    }

    .ca-empty .ca-empty__title--display {
      font-size: var(--ca-font-size-display-3);
      letter-spacing: var(--ca-display-tracking);
      line-height: var(--ca-display-leading);
    }

    .ca-empty--hero .ca-empty__description {
      max-width: calc(var(--ca-space-unit) * 90);
    }

    .ca-empty--hero .ca-empty__actions {
      margin-top: var(--ca-space-4);
    }

    /* Narrow slot (not narrow viewport): the empty state sits in cards and panes too.
       A container query cannot restyle its own container, so only descendants change here;
       the root already fills its slot (width: 100%). */
    @container (max-width: 599.98px) {
      .ca-empty--hero .ca-empty__actions {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        max-width: calc(var(--ca-space-unit) * 90);
      }
      .ca-empty--hero .ca-empty__actions > :global(*) {
        width: 100%;
      }
    }
}
</style>

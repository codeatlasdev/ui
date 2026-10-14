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
    description?: string;
    actions?:     Snippet;
    class?:       string;
    children?:    Snippet;
  }

  let { icon: Icon, title, headingLevel, variant = 'default', description, actions, children, class: className = '' }: Props = $props();

  // Read once at init: context lookups are only valid during component initialisation.
  const inheritedLevel = sectionHeadingLevel(5);
  const level = $derived(headingLevel ?? inheritedLevel);
</script>

<div class="ca-empty ca-empty--{variant} {className}" role="status" aria-label={title}>
  {#if Icon}
    <div class="ca-empty__icon" aria-hidden="true">
      <Icon size={variant === 'hero' ? 32 : 24} stroke-width={1.5} />
    </div>
  {/if}
  <svelte:element this={`h${level}`} class="ca-empty__title">{title}</svelte:element>
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
      padding: var(--ca-space-12) var(--ca-space-6);
    }

    .ca-empty__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-12);
      height: var(--ca-space-12);
      border-radius: var(--ca-radius-lg);
      background: var(--ca-action-hover);
      color: var(--ca-text-secondary);
      flex-shrink: 0;
    }

    .ca-empty__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-body1);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-primary);
      margin: 0;
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
    }

    .ca-empty__description {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      max-width: calc(var(--ca-space-unit) * 85);
      line-height: var(--ca-line-height-body);
    }

    .ca-empty__actions {
      display: flex;
      flex-direction: row;
      gap: var(--ca-space-2);
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: var(--ca-space-1);
    }

    /* ── Hero ──────────────────────────────────────────────────── */
    .ca-empty--hero {
      gap: var(--ca-space-2);
      padding: calc(var(--ca-space-12) + var(--ca-space-2)) var(--ca-space-6);
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
      font-size: var(--ca-font-size-h6);
      font-weight: var(--ca-font-weight-heading);
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

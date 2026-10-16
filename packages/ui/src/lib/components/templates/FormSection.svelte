<script lang="ts">
  /**
   * FormSection: form section with a title, description and field layout.
   *
   * Layout picked automatically from the content:
   *   layout="grid"  → text fields, selects (2 columns, auto-fill 260px), the default
   *   layout="list"  → Switch, SettingItem, Divider (single column, no gap)
   *   layout="stack" → composite blocks (Avatar row, groups) (single column, 16px gap)
   *
   * Usage:
   *   <FormSection title="Account" description="Basic info.">
   *     <TextField label="Name" />
   *     <TextField label="Email" type="email" />
   *   </FormSection>
   *
   *   <FormSection title="Notifications" layout="list">
   *     <SettingItem label="Email"><Switch /></SettingItem>
   *     <Divider />
   *     <SettingItem label="Push"><Switch /></SettingItem>
   *   </FormSection>
   */
  import type { Snippet } from 'svelte';
  import type { HeadingLevel } from '../../types.js';
  import { sectionHeadingLevel } from '../PageShell/heading-context.js';

  interface Props {
    label?:       string;
    title?:       string;   // alias for label
    /**
     * Heading level of the title (2–6). Only the tag changes, never the look.
     * Defaults to 2 inside `PageShell`/`AppSettings`/`AppForm` (under their `<h1>`), 5 elsewhere.
     */
    headingLevel?: HeadingLevel;
    description?: string;
    layout?:      'grid' | 'list' | 'stack';
    class?:       string;
    children?:    Snippet;
  }

  let {
    label,
    title,
    headingLevel,
    description,
    layout = 'grid',
    class: className = '',
    children,
  }: Props = $props();

  const heading = $derived(label ?? title);
  // Read once at init: context lookups are only valid during component initialisation.
  const inheritedLevel = sectionHeadingLevel(5);
  const level = $derived(headingLevel ?? inheritedLevel);
</script>

<section class="ca-form-section ca-form-section--{layout} {className}" data-ca-blur="mat-thin">
  {#if heading || description}
    <div class="ca-form-section__header">
      {#if heading}<svelte:element this={`h${level}`} class="ca-form-section__title">{heading}</svelte:element>{/if}
      {#if description}<p class="ca-form-section__desc">{description}</p>{/if}
    </div>
  {/if}
  <div class="ca-form-section__fields">
    {@render children?.()}
  </div>
</section>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-form-section {
      container-type: inline-size;
      background: var(--ca-mat-thin-fill);
      border-radius: var(--ca-radius-lg);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      padding: var(--ca-card-padding);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-4);
    }

    /* ── Header ──────────────────────────────────────────────────── */
    .ca-form-section__header {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
    }

    .ca-form-section__title {
      font-family: var(--ca-font-display);
      font-size: var(--ca-font-size-h6);
      font-weight: var(--ca-font-weight-semibold);
      letter-spacing: var(--ca-heading-tracking);
      text-transform: var(--ca-heading-case);
      color: var(--ca-text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .ca-form-section__desc {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-relaxed);
    }

    /* ── grid: default, 2 columns for text fields ────────────────── */
    .ca-form-section--grid .ca-form-section__fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(calc(var(--ca-space-unit) * 65), 1fr));
      gap: var(--ca-space-3);
    }

    /* ── list: single flush column: Switch, SettingItem, Divider ─── */
    .ca-form-section--list .ca-form-section__fields {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── stack: single column with gap: Avatar row, groups ─────────  */
    .ca-form-section--stack .ca-form-section__fields {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-4);
    }

    /* ── Narrow slot ─────────────────────────────────────────────────
       auto-fill already drops to one column when two 65-unit tracks do not fit; below the
       track minimum itself (a phone-width card) the single track must be allowed to shrink. */
    @container (max-width: 599.98px) {
      .ca-form-section--grid .ca-form-section__fields {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--ca-space-unit) * 65)), 1fr));
      }
    }
    @media (max-width: 599.98px) {
      .ca-form-section { padding: var(--ca-space-4); }
    }
}
</style>

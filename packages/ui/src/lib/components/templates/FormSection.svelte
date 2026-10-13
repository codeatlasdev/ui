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

  interface Props {
    label?:       string;
    title?:       string;   // alias for label
    description?: string;
    layout?:      'grid' | 'list' | 'stack';
    class?:       string;
    children?:    Snippet;
  }

  let {
    label,
    title,
    description,
    layout = 'grid',
    class: className = '',
    children,
  }: Props = $props();

  const heading = $derived(label ?? title);
</script>

<section class="ca-form-section ca-form-section--{layout} {className}">
  {#if heading || description}
    <div class="ca-form-section__header">
      {#if heading}<h5 class="ca-form-section__title">{heading}</h5>{/if}
      {#if description}<p class="ca-form-section__desc">{description}</p>{/if}
    </div>
  {/if}
  <div class="ca-form-section__fields">
    {@render children?.()}
  </div>
</section>

<style>
  .ca-form-section {
    background: var(--ca-glass-tint-thin);
    -webkit-backdrop-filter: var(--ca-blur-thin);
    backdrop-filter: var(--ca-blur-thin);
    border-radius: var(--ca-radius-lg);
    border: 1px solid var(--ca-outline-subtle);
    padding: var(--ca-space-5, 20px);
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-4, 16px);
  }

  /* ── Header ──────────────────────────────────────────────────── */
  .ca-form-section__header {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1, 4px);
  }

  .ca-form-section__title {
    font-size: var(--ca-font-size-h6);
    font-weight: 600;
    color: var(--ca-text-primary);
    margin: 0;
    line-height: 1.3;
  }

  .ca-form-section__desc {
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  /* ── grid: default, 2 columns for text fields ────────────────── */
  .ca-form-section--grid .ca-form-section__fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--ca-space-3, 12px);
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
    gap: var(--ca-space-4, 16px);
  }

  /* ── Mobile ─────────────────────────────────────────────────── */
  @media (max-width: 599px) {
    .ca-form-section { padding: var(--ca-space-4, 16px); }
    .ca-form-section--grid .ca-form-section__fields {
      grid-template-columns: 1fr;
    }
  }
</style>

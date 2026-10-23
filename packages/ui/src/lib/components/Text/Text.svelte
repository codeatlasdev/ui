<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Text: a run of text in one of the named type roles. The role is a size, leading, tracking and
   * weight bundle (`--ca-text-<role>-*`) that `ThemeOptions.type` overrides for the whole app,
   * library components included. `num` renders tabular digits for counts, times and prices.
   *
   *   <Text role="label">Email</Text>
   *   <Text role="num" as="strong">1,284</Text>
   */
  type Role = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'num';

  interface Props {
    /** Type role. Defaults to `body`. */
    role?:     Role;
    /** Element to render. Only the tag changes, never the look. Defaults to `span`. */
    as?:       'span' | 'p' | 'div' | 'strong' | 'em' | 'small' | 'label' | 'dt' | 'dd' | 'li';
    class?:    string;
    children?: Snippet;
  }

  let { role = 'body', as = 'span', class: className = '', children }: Props = $props();
</script>

<svelte:element this={as} class="ca-text ca-text-{role} {className}">
  {@render children?.()}
</svelte:element>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-text { margin: 0; color: inherit; font: var(--_w) var(--_s) / var(--_l) var(--_f); letter-spacing: var(--_t); }
    .ca-text-title   { --_w: var(--ca-text-title-weight, var(--ca-font-weight-heading)); --_s: var(--ca-text-title-size); --_l: var(--ca-text-title-leading, var(--ca-line-height-tight)); --_f: var(--ca-font-display); --_t: var(--ca-text-title-tracking, var(--ca-heading-tracking)); }
    .ca-text-heading { --_w: var(--ca-text-heading-weight, var(--ca-font-weight-heading)); --_s: var(--ca-text-heading-size); --_l: var(--ca-text-heading-leading, var(--ca-line-height-tight)); --_f: var(--ca-font-display); --_t: var(--ca-text-heading-tracking, var(--ca-heading-tracking)); }
    .ca-text-body    { --_w: var(--ca-text-body-weight, var(--ca-font-weight-regular)); --_s: var(--ca-text-body-size); --_l: var(--ca-text-body-leading, var(--ca-line-height-body)); --_f: var(--ca-font-sans); --_t: var(--ca-text-body-tracking, normal); }
    .ca-text-label   { --_w: var(--ca-text-label-weight); --_s: var(--ca-text-label-size); --_l: var(--ca-text-label-leading); --_f: var(--ca-font-sans); --_t: var(--ca-text-label-tracking); }
    .ca-text-caption { --_w: var(--ca-text-caption-weight, var(--ca-font-weight-regular)); --_s: var(--ca-text-caption-size); --_l: var(--ca-text-caption-leading, var(--ca-line-height-snug)); --_f: var(--ca-font-sans); --_t: var(--ca-text-caption-tracking, normal); }
    .ca-text-num     { --_w: var(--ca-text-num-weight, var(--ca-font-weight-medium)); --_s: var(--ca-text-num-size, var(--ca-font-size-body2)); --_l: var(--ca-text-num-leading, var(--ca-line-height-tight)); --_f: var(--ca-font-sans); --_t: var(--ca-text-num-tracking, normal); font-variant-numeric: tabular-nums; }
}
</style>

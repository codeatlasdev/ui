<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLLabelAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLLabelAttributes, 'class' | 'children' | 'hidden'> {
    /** Adds the required marker (decorative: the control carries `required` / `aria-required`). */
    required?: boolean;
    /** Keeps the label for assistive tech only. */
    hidden?: boolean;
    class?: string;
    children: Snippet;
  }

  let { required = false, hidden = false, class: className = '', children, ...rest }: Props = $props();
</script>

<label {...rest} class="ca-label {className}" class:ca-sr-only={hidden}>
  {@render children()}{#if required}<span class="ca-label__req" aria-hidden="true"> *</span>{/if}
</label>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      line-height: var(--ca-field-label-leading, var(--ca-line-height-snug));
      letter-spacing: var(--ca-field-label-tracking, inherit);
      color: var(--ca-text-primary);
    }
    .ca-label__req { color: var(--ca-field-required-color, var(--ca-semantic-error)); }
}
</style>

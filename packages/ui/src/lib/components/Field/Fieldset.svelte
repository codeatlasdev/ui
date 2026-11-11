<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The group's name: a `<legend>`. */
    legend: string;
    hideLegend?: boolean;
    description?: string;
    /** Group-level error: `role="alert"`, and the group gets `aria-invalid`. */
    error?: string;
    disabled?: boolean;
    class?: string;
    children: Snippet;
  }

  let { legend, hideLegend = false, description, error, disabled = false, class: className = '', children }: Props = $props();
  const uid = $props.id();
  const describedBy = $derived(
    [description ? `${uid}-desc` : '', error ? `${uid}-err` : ''].filter(Boolean).join(' ') || undefined
  );
</script>

<fieldset class="ca-fieldset {className}" {disabled} aria-describedby={describedBy}>
  <legend class="ca-fieldset__legend" class:ca-sr-only={hideLegend}>{legend}</legend>
  {#if description}<p id="{uid}-desc" class="ca-fieldset__description">{description}</p>{/if}
  <div class="ca-fieldset__body">{@render children()}</div>
  {#if error}<p id="{uid}-err" class="ca-fieldset__error" role="alert">{error}</p>{/if}
</fieldset>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-fieldset { margin: 0; padding: 0; border: 0; min-width: 0; display: flex; flex-direction: column; gap: var(--ca-space-2); }
    .ca-fieldset__legend { padding: 0; font-size: var(--ca-font-size-label); font-weight: var(--ca-font-weight-semibold); color: var(--ca-text-primary); }
    .ca-fieldset__body { display: flex; flex-direction: column; gap: var(--ca-space-3); }
    .ca-fieldset__description, .ca-fieldset__error { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
    .ca-fieldset__error { color: var(--ca-semantic-error); }
}
</style>

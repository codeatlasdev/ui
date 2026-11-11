<script lang="ts" module>
  /** What `Field` passes to its control: spread it onto the element that takes the value. */
  export interface FieldControlProps {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': 'true' | undefined;
    'aria-required': 'true' | undefined;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Label from './Label.svelte';

  interface Props {
    /** Visible label, tied to the control by `for`/`id`. */
    label: string;
    /** Keeps the label for assistive tech only. */
    hideLabel?: boolean;
    /** Help text under the control, read after the label. */
    description?: string;
    /** Error under the control: `role="alert"`, and the control gets `aria-invalid`. */
    error?: string;
    required?: boolean;
    class?: string;
    /** The control. Spread the props it receives onto the element that takes the value. */
    children: Snippet<[FieldControlProps]>;
  }

  let { label, hideLabel = false, description, error, required = false, class: className = '', children }: Props = $props();

  const uid = $props.id();
  const id = `${uid}-control`;
  const describedBy = $derived(
    [description ? `${uid}-desc` : '', error ? `${uid}-err` : ''].filter(Boolean).join(' ') || undefined
  );
  const control = $derived<FieldControlProps>({
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined,
  });
</script>

<div class="ca-field {className}" data-invalid={error ? '' : undefined}>
  <Label for={id} {required} hidden={hideLabel}>{label}</Label>
  {@render children(control)}
  {#if description}<p id="{uid}-desc" class="ca-field__description">{description}</p>{/if}
  {#if error}<p id="{uid}-err" class="ca-field__error" role="alert">{error}</p>{/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-field { display: flex; flex-direction: column; gap: var(--ca-field-gap, var(--ca-space-1)); min-width: 0; }
    .ca-field__description, .ca-field__error {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      line-height: var(--ca-field-hint-leading, var(--ca-line-height-snug));
      color: var(--ca-field-hint-color, var(--ca-text-secondary));
    }
    .ca-field__error { color: var(--ca-semantic-error); }
}
</style>

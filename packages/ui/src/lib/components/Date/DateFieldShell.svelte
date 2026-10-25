<script lang="ts">
  /**
   * Internal: the chrome shared by DateField, TimeField, DatePicker and DateRangePicker: label,
   * the bordered group around the segments, the hidden native-form input, and the error or
   * description line. The segments and the trigger button are passed in as snippets. Not exported
   * from the package.
   */
  import type { Component, Snippet } from 'svelte';
  import DateSegments from './DateSegments.svelte';
  import type { FieldState } from './field-state.svelte.js';

  interface Props {
    /** Base id; ids derived from it: `-label`, `-err`, `-hint`. */
    id: string;
    /** Its segments are rendered (unless `segments` is given); it receives the focus when the label is clicked. */
    field: FieldState;
    label?: string;
    description?: string;
    error?: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    size: 'sm' | 'md';
    class: string;
    /** Popover state of a picker: marks the group `data-state="open"`. */
    open?: boolean;
    /** A picker: renders the calendar button with this icon after the segments. */
    triggerIcon?: Component<{ size?: number; strokeWidth?: number; 'aria-hidden'?: 'true' }>;
    triggerLabel?: string;
    /** Bound to the calendar button (the popover anchors to it and focus returns to it). */
    triggerEl?: HTMLElement | null;
    onToggle?: () => void;
    /**
     * A range wraps everything in `<div role="group" id>`, labels with a `<span>` and names the
     * group with `aria-label` (it holds two fields, each with its own segments).
     */
    range?: boolean;
    /** Hidden input for native forms (ISO string); omitted when there is no `name`. */
    name?: string;
    formValue?: string;
    /** Bound to the group element (FieldState reads its segments from it). */
    wrap: HTMLElement | null;
    /** Replaces the default segments of `field` (a range renders two fields). */
    segments?: Snippet;
  }

  let {
    id,
    field,
    label,
    description,
    error,
    disabled,
    readonly,
    required,
    size,
    class: className,
    open,
    triggerIcon: TriggerIcon,
    triggerLabel,
    triggerEl = $bindable(),
    onToggle,
    range = false,
    name,
    formValue,
    wrap = $bindable(),
    segments,
  }: Props = $props();

  const describedBy = $derived(error ? `${id}-err` : description ? `${id}-hint` : undefined);
  const focusFirst = () => !disabled && field.focusFirst();
</script>

{#snippet body()}
  <div class="ca-date {className}" class:ca-date--sm={size === 'sm'} class:ca-date--error={!!error} class:ca-date--disabled={disabled}>
    {#if label}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <svelte:element this={range ? 'span' : 'div'} class="ca-date__label" id="{id}-label" onclick={focusFirst}>
        {label}{#if required}<span class="ca-date__req" aria-hidden="true"> *</span>{/if}
      </svelte:element>
    {/if}

    <div
      class="ca-date__wrap"
      role="group"
      bind:this={wrap}
      aria-label={range ? label : undefined}
      aria-labelledby={!range && label ? `${id}-label` : undefined}
      aria-describedby={describedBy}
      aria-disabled={range ? undefined : disabled}
      data-invalid={!range && (error || field.invalid) ? '' : undefined}
      data-disabled={!range && disabled ? '' : undefined}
      data-state={!range && open ? 'open' : undefined}
    >
      {#if segments}
        {@render segments()}
      {:else}
        <DateSegments
          {field}
          base={id}
          labelId={label ? `${id}-label` : undefined}
          {disabled}
          {readonly}
          invalid={!!error || field.invalid}
        />
      {/if}
      {#if TriggerIcon}
        <button
          type="button"
          class="ca-date__trigger"
          bind:this={triggerEl}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${id}-content` : undefined}
          data-segment="trigger"
          data-state={open ? 'open' : 'closed'}
          {disabled}
          onclick={() => {
            if (!readonly) onToggle?.();
          }}
        >
          <TriggerIcon size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      {/if}
    </div>
    {#if name}
      <input
        {name}
        value={formValue ?? ''}
        {required}
        tabindex="-1"
        aria-hidden="true"
        class="ca-sr-only"
        style="transform:translateX(-100%)"
      />
    {/if}

    {#if error}
      <p id="{id}-err" class="ca-date__hint ca-date__hint--error" role="alert">{error}</p>
    {:else if description}
      <p id="{id}-hint" class="ca-date__hint">{description}</p>
    {/if}
  </div>
{/snippet}

{#if range}
  <div role="group" {id}>{@render body()}</div>
{:else}
  {@render body()}
{/if}

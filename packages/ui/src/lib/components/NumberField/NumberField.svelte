<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { numberField } from '../../i18n/groups/numberField.js';
  import { Minus, Plus } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { uid } from '../../utils/index.js';
  import { fieldWidth, type FieldWidth } from '../../utils/field-width.js';
  import type { FieldVariant } from '../../theme/components.js';
  import '../field-variant.css';
  const t = useMessages(numberField);

  interface Props {
    value?:       number;
    min?:         number;
    max?:         number;
    step?:        number;
    label?:       string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`), for a field in a toolbar, table or grid that already shows its name. */
    hideLabel?:   boolean;
    /** `full` (default) fills the row; `auto` and `fit` size to the content; any CSS length sets the width. Written to `--ca-field-width`, so a `Toolbar` sets it for every field inside. */
    width?:       FieldWidth;
    /** `false` drops the +/- buttons: a compact numeric input that sizes to its content. Arrow keys still step the value. Default `true`. */
    steppers?:    boolean;
    disabled?:    boolean;
    class?:       string;
    error?:       string;
    description?: string;
    required?:    boolean;
    name?:        string;
    size?:        'sm' | 'md';
    /** How the field is drawn: `outlined` (the style's own), `filled` or `underline`. Default follows the theme (`components.field.variant`). */
    variant?:        FieldVariant;
    /** A companion control after the number, usually its unit (a `Select` of units). Rendered in the same row; the field becomes a `role="group"` named by `label`, so the pair reads as one control. Give the companion its own accessible name (`hideLabel` + `label`). */
    suffix?:      Snippet;
    onchange?:    (value: number) => void;
  }

  let {
    value    = $bindable(0),
    min,
    max,
    step     = 1,
    label,
    hideLabel = false,
    width,
    steppers = true,
    disabled = false,
    class: className = '',
    error,
    description,
    required = false,
    name,
    size     = 'md',
    variant,
    suffix,
    onchange,
  }: Props = $props();

  let inputId = $state(uid('nf'));
  let focused = $state(false);

  function increment() {
    const next = value + step;
    value = max !== undefined ? Math.min(next, max) : next;
    onchange?.(value);
  }

  function decrement() {
    const next = value - step;
    value = min !== undefined ? Math.max(next, min) : next;
    onchange?.(value);
  }

  function handleInput(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(v)) {
      value = v;
      onchange?.(v);
    }
  }

  let atMin = $derived(min !== undefined && value <= min);
  let atMax = $derived(max !== undefined && value >= max);
</script>

<div
  class="ca-nf {className}"
  class:ca-nf--sm={size === 'sm'}
  class:ca-nf--error={!!error}
  class:ca-nf--disabled={disabled}
  style:--ca-field-width={fieldWidth(width)}
  data-ca-field={variant}
  role={suffix ? 'group' : undefined}
  aria-labelledby={suffix && label ? `${inputId}-label` : undefined}
>
  {#if label}
    <label id={suffix ? `${inputId}-label` : undefined} for={inputId} class="ca-nf__label" class:ca-sr-only={hideLabel}>
      {label}{#if required}<span class="ca-nf__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  {#snippet control()}
  <div class="ca-nf__wrap" class:ca-nf__wrap--focused={focused} class:ca-nf__wrap--error={!!error}>
    {#if steppers}
      <button
        type="button"
        class="ca-nf__btn"
        aria-label={t().numberField.decrease}
        disabled={disabled || atMin}
        onclick={decrement}
      >
        <Minus size={14} />
      </button>
    {/if}
    <input
      id={inputId}
      {name}
      type="number"
      value={value}
      {min}
      {max}
      {step}
      {disabled}
      {required}
      class="ca-nf__input"
      aria-describedby={error ? `${inputId}-err` : description ? `${inputId}-hint` : undefined}
      aria-invalid={error ? 'true' : undefined}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
      oninput={handleInput}
    />
    {#if steppers}
      <button
        type="button"
        class="ca-nf__btn"
        aria-label={t().numberField.increase}
        disabled={disabled || atMax}
        onclick={increment}
      >
        <Plus size={14} />
      </button>
    {/if}
  </div>
  {/snippet}

  {#if suffix}
    <div class="ca-nf__row">
      {@render control()}
      <div class="ca-nf__suffix">{@render suffix()}</div>
    </div>
  {:else}
    {@render control()}
  {/if}

  {#if error}
    <p id="{inputId}-err" class="ca-nf__hint ca-nf__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{inputId}-hint" class="ca-nf__hint">{description}</p>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* ── Root ──────────────────────────────────────────────────── */
    .ca-nf {
      display: flex;
      flex-direction: column;
      gap: var(--ca-nf-gap, var(--ca-field-gap, var(--ca-space-1)));
      width: var(--ca-field-width, auto);
      min-width: var(--ca-field-min-width, 0);
    }

    /* ── Label ─────────────────────────────────────────────────── */
    .ca-nf__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-nf-label-line-height, var(--ca-field-label-leading, var(--ca-line-height-snug)));
      letter-spacing: var(--ca-nf-label-tracking, var(--ca-field-label-tracking, inherit));
      user-select: none;
    }

    .ca-nf__req {
      color: var(--ca-field-required-color, var(--ca-semantic-error));
    }

    /* ── Wrap ──────────────────────────────────────────────────── */
    .ca-nf__wrap {
      display: inline-flex;
      align-items: stretch;
      border-radius: var(--ca-field-radius, var(--ca-radius-control));
      background: var(--ca-field-bg);
      border: var(--ca-field-border-width, var(--ca-border-width)) solid var(--ca-field-border-color);
      box-shadow: var(--ca-field-shadow);
      overflow: hidden;
      height: var(--ca-control-height);
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        box-shadow   var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-nf__wrap--focused {
      border-color: var(--ca-focus-ring);
      box-shadow: 0 0 0 var(--ca-border-width-focus) var(--ca-focus-ring);
    }

    .ca-nf__wrap--error {
      border-color: var(--ca-semantic-error);
      box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
    }

    .ca-nf--disabled .ca-nf__wrap {
      background: var(--ca-action-disabled-bg);
      border-color: var(--ca-outline-default);
      color: var(--ca-text-disabled);
      pointer-events: none;
    }

    /* ── Suffix: the unit companion shares the control row ─────── */
    .ca-nf__row {
      display: flex;
      align-items: stretch;
      gap: var(--ca-space-2);
    }

    .ca-nf__row > .ca-nf__wrap {
      flex: 1 1 auto;
      min-width: 0;
    }

    .ca-nf__suffix {
      display: flex;
      align-items: stretch;
      flex: 0 0 auto;
    }

    /* ── Buttons ───────────────────────────────────────────────── */
    .ca-nf__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-8);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ca-text-secondary);
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color      var(--ca-duration-fast) var(--ca-ease-standard);
      flex-shrink: 0;
    }

    .ca-nf__btn:hover:not(:disabled) {
      background: var(--ca-action-hover);
      color: var(--ca-text-primary);
    }

    .ca-nf__btn:disabled {
      color: var(--ca-text-disabled);
      cursor: not-allowed;
    }

    .ca-nf__btn:first-child {
      border-right: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    .ca-nf__btn:last-child {
      border-left: var(--ca-border-width) solid var(--ca-outline-subtle);
    }

    /* ── Input ─────────────────────────────────────────────────── */
    .ca-nf__input {
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      outline: none;
      text-align: center;
      font-size: var(--ca-input-font-size);
      letter-spacing: var(--ca-nf-letter-spacing, var(--ca-input-letter-spacing, inherit));
      line-height: var(--ca-nf-line-height, var(--ca-input-line-height, inherit));
      color: var(--ca-text-primary);
      font-family: inherit;
      /* Hide native number spinners */
      -moz-appearance: textfield;
      appearance: textfield;
    }

    .ca-nf__input::-webkit-inner-spin-button,
    .ca-nf__input::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }

    /* ── Helper / error text ───────────────────────────────────── */
    .ca-nf__hint {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-field-hint-color, var(--ca-text-secondary));
      margin: 0;
      line-height: var(--ca-nf-hint-leading, var(--ca-field-hint-leading, var(--ca-line-height-snug)));
      letter-spacing: var(--ca-nf-hint-tracking, var(--ca-field-hint-tracking, inherit));
    }

    .ca-nf__hint--error {
      color: var(--ca-semantic-error);
    }

    /* ── Size: sm ──────────────────────────────────────────────── */
    .ca-nf--sm .ca-nf__wrap {
      height: var(--ca-control-height-sm);
    }

    .ca-nf--sm .ca-nf__btn {
      width: var(--ca-space-7);
    }

    .ca-nf--sm .ca-nf__input {
      font-size: var(--ca-input-font-size-sm);
    }

}
</style>

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
    /** Bindable. `null` when the field is empty (the user cleared it). */
    value?:       number | null;
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
    /**
     * Locale the user types in (BCP 47). With it the field reads and shows that locale's decimal mark
     * (`2,5` in `pt-BR`; a `.` is accepted too) and is a text input with `inputmode="decimal"` and
     * `role="spinbutton"`, stepped by ArrowUp/ArrowDown and Home/End. Without it the field is a native
     * `type="number"`, whose decimal mark follows the browser.
     */
    locale?:      string;
    /** Called with the new value, `null` when the field was cleared. */
    onchange?:    (value: number | null) => void;
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
    locale,
    onchange,
  }: Props = $props();

  let inputId = $state(uid('nf'));
  let focused = $state(false);

  /** Text mode (`locale` set): the user's text while typing; `null` shows the formatted value. */
  let draft = $state<string | null>(null);
  const decimal = $derived(
    locale
      ? (new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.')
      : '.'
  );
  const shown = $derived(draft ?? (value == null ? '' : String(value).replace('.', decimal)));

  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n));

  function set(next: number | null) {
    if (next === value) return;
    value = next;
    onchange?.(next);
  }

  // A step keeps the precision of its operands, so 0.1 + 0.2 lands on 0.3 and 1.125 + 1 on 2.125.
  // An empty field steps to 0, clamped to min/max.
  const places = (n: number) => (/e/i.test(String(n)) ? -1 : (String(n).split('.')[1] ?? '').length);
  function add(n: number, delta: number): number {
    const p = Math.max(places(n), places(delta));
    return p < 0 ? n + delta : Number((n + delta).toFixed(p));
  }
  function increment() {
    set(clamp(value == null ? 0 : add(value, step)));
  }

  function decrement() {
    set(clamp(value == null ? 0 : add(value, -step)));
  }

  /** `null` for an empty field, `undefined` while the text is not a number yet (`-`, `2,5,`). */
  function parse(raw: string): number | null | undefined {
    const s = raw.replace(/[\s\u00a0\u202f]/g, '');
    if (s === '') return null;
    if (!/^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(s)) return undefined;
    return Number(s.replace(',', '.'));
  }

  function handleInput(e: Event) {
    const el = e.target as HTMLInputElement;
    if (locale) {
      draft = el.value;
      const n = parse(el.value);
      if (n !== undefined) set(n);
      return;
    }
    // A native number input reports "" both when empty and while the text is not a number yet ("-"):
    // only a really empty field clears the value (#1209).
    if (el.value === '') {
      if (!el.validity.badInput) set(null);
      return;
    }
    const v = parseFloat(el.value);
    if (!isNaN(v)) set(v);
  }

  /** Leaving the field: typed values are clamped to min/max and the text shows the committed value. */
  function commit(e: FocusEvent) {
    focused = false;
    draft = null;
    const el = e.target as HTMLInputElement;
    if (value != null) set(clamp(value));
    if (!locale && el.validity.badInput) el.value = value == null ? '' : String(value);
  }

  function onkeydown(e: KeyboardEvent) {
    if (!locale) return;
    const keys: Record<string, () => void> = {
      ArrowUp: increment,
      ArrowDown: decrement,
      Home: () => min !== undefined && set(min),
      End: () => max !== undefined && set(max),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    draft = null;
    run();
  }

  let atMin = $derived(min !== undefined && value != null && value <= min);
  let atMax = $derived(max !== undefined && value != null && value >= max);
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
    {#if locale}
      <!-- Text mode: a native number input cannot take a decimal comma in an English browser (#1209). -->
      <input
        id={inputId}
        {name}
        type="text"
        inputmode="decimal"
        autocomplete="off"
        role="spinbutton"
        value={shown}
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        {disabled}
        {required}
        class="ca-nf__input"
        aria-describedby={error ? `${inputId}-err` : description ? `${inputId}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        onfocus={() => (focused = true)}
        onblur={commit}
        oninput={handleInput}
        {onkeydown}
      />
    {:else}
      <input
        id={inputId}
        {name}
        type="number"
        value={value ?? ''}
        {min}
        {max}
        {step}
        {disabled}
        {required}
        class="ca-nf__input"
        aria-describedby={error ? `${inputId}-err` : description ? `${inputId}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        onfocus={() => (focused = true)}
        onblur={commit}
        oninput={handleInput}
      />
    {/if}
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

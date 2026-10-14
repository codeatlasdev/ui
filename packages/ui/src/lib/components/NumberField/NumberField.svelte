<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import { Minus, Plus } from '@lucide/svelte';
  import { uid } from '../../utils/index.js';
  const t = useT();

  interface Props {
    value?:       number;
    min?:         number;
    max?:         number;
    step?:        number;
    label?:       string;
    disabled?:    boolean;
    class?:       string;
    error?:       string;
    description?: string;
    required?:    boolean;
    name?:        string;
    size?:        'sm' | 'md';
    onchange?:    (value: number) => void;
  }

  let {
    value    = $bindable(0),
    min,
    max,
    step     = 1,
    label,
    disabled = false,
    class: className = '',
    error,
    description,
    required = false,
    name,
    size     = 'md',
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
>
  {#if label}
    <label for={inputId} class="ca-nf__label">
      {label}{#if required}<span class="ca-nf__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <div class="ca-nf__wrap" class:ca-nf__wrap--focused={focused} class:ca-nf__wrap--error={!!error}>
    <button
      type="button"
      class="ca-nf__btn"
      aria-label={t().numberField.decrease}
      disabled={disabled || atMin}
      onclick={decrement}
    >
      <Minus size={14} />
    </button>
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
    <button
      type="button"
      class="ca-nf__btn"
      aria-label={t().numberField.increase}
      disabled={disabled || atMax}
      onclick={increment}
    >
      <Plus size={14} />
    </button>
  </div>

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
      gap: var(--ca-space-1);
    }

    /* ── Label ─────────────────────────────────────────────────── */
    .ca-nf__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-snug);
      user-select: none;
    }

    .ca-nf__req {
      color: var(--ca-semantic-error);
    }

    /* ── Wrap ──────────────────────────────────────────────────── */
    .ca-nf__wrap {
      display: inline-flex;
      align-items: stretch;
      border-radius: var(--ca-radius-control);
      background: var(--ca-field-bg);
      border: var(--ca-border-width) solid var(--ca-field-border-color);
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
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
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

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { Eye, EyeOff } from '@lucide/svelte';
  import { uid } from '../../utils/index.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { textField } from '../../i18n/groups/textField.js';
  const t = useMessages(textField);

  interface Props
    extends Omit<HTMLInputAttributes, 'value' | 'class' | 'children' | 'size' | 'oninput' | 'onchange' | 'onfocus' | 'onblur'> {
    label?:        string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`), for inline fields in a list or toolbar. */
    hideLabel?:    boolean;
    placeholder?:  string;
    value?:        string;
    type?:         string;
    error?:        string;
    description?:  string;
    /** @deprecated Use `description` instead */
    helperText?:   string;
    disabled?:     boolean;
    required?:     boolean;
    /** `false` hides the asterisk of a `required` field (the input stays `required`), for forms where nothing is optional. */
    requiredIndicator?: boolean;
    readonly?:     boolean;
    autocomplete?: HTMLInputAttributes["autocomplete"];
    leading?:      Snippet;
    trailing?:     Snippet;
    /** `type="password"` only: adds an eye button inside the field that shows or hides the value (`aria-pressed`, localized name). */
    revealable?:   boolean;
    /** Content under the field and its hint, such as a "Forgot password?" link or a strength meter. */
    below?:        Snippet;
    size?:         'sm' | 'md';
    /** Loading placeholder: same size as the loaded field, disabled, announced as busy. */
    skeleton?:     boolean;
    class?:        string;
    name?:         string;
    /** The native `<input>`, to focus it or read it. */
    ref?:          HTMLInputElement | null;
    oninput?:      (value: string) => void;
    onchange?:     (value: string) => void;
    onfocus?:      (e: FocusEvent) => void;
    onblur?:       (e: FocusEvent) => void;
  }

  let {
    label,
    hideLabel    = false,
    placeholder = '',
    value        = $bindable(''),
    type         = 'text',
    error,
    description,
    helperText,
    disabled     = false,
    required     = false,
    requiredIndicator = true,
    readonly     = false,
    autocomplete,
    leading,
    trailing,
    revealable   = false,
    below,
    size         = 'md',
    skeleton     = false,
    class: className = '',
    name,
    ref          = $bindable(null),
    oninput,
    onchange,
    onfocus,
    onblur,
    ...rest
  }: Props = $props();

  let focused = $state(false);
  const id    = uid('tf');
  const hint  = $derived(description ?? helperText);
  const canReveal = $derived(revealable && type === 'password');
  let revealed    = $state(false);
  const inputType = $derived(canReveal && revealed ? 'text' : type);
</script>

<div class="ca-tf {className}" aria-busy={skeleton ? 'true' : undefined} data-skeleton={skeleton ? '' : undefined} class:ca-tf--sm={size === 'sm'} class:ca-tf--error={!!error} class:ca-tf--disabled={disabled}>
  {#if label}
    <label for={id} class="ca-tf__label" class:ca-sr-only={hideLabel}>
      {label}{#if required && requiredIndicator}<span class="ca-tf__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <div class="ca-tf__wrap" class:ca-tf__wrap--focused={focused} class:ca-tf__wrap--error={!!error}>
    {#if leading}
      <span class="ca-tf__adorn ca-tf__adorn--lead" aria-hidden="true">{@render leading()}</span>
    {/if}

    <input
      {...rest}
      bind:this={ref}
      {id}
      type={inputType}
      {name}
      {placeholder}
      disabled={disabled || skeleton}
      {required}
      {readonly}
      {autocomplete}
      bind:value
      class="ca-tf__input"
      aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      aria-invalid={error ? 'true' : undefined}
      onfocus={(e) => { focused = true; onfocus?.(e); }}
      onblur={(e) => { focused = false; onblur?.(e); }}
      oninput={(e) => oninput?.((e.target as HTMLInputElement).value)}
      onchange={(e) => onchange?.((e.target as HTMLInputElement).value)}
    />

    {#if trailing || canReveal}
      <span class="ca-tf__adorn ca-tf__adorn--trail">
        {@render trailing?.()}
        {#if canReveal}
          <button
            type="button"
            class="ca-tf__reveal"
            aria-label={revealed ? t().textField.hidePassword : t().textField.showPassword}
            aria-pressed={revealed}
            disabled={disabled || skeleton}
            onclick={() => (revealed = !revealed)}
          >
            {#if revealed}<EyeOff size={size === 'sm' ? 14 : 16} aria-hidden="true" />{:else}<Eye size={size === 'sm' ? 14 : 16} aria-hidden="true" />{/if}
          </button>
        {/if}
      </span>
    {/if}
  </div>

  {#if error}
    <p id="{id}-err" class="ca-tf__hint ca-tf__hint--error" role="alert">{error}</p>
  {:else if hint}
    <p id="{id}-hint" class="ca-tf__hint">{hint}</p>
  {/if}

  {#if below}
    <div class="ca-tf__below">{@render below()}</div>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* ── Root ──────────────────────────────────────────────────── */
    .ca-tf {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      width: 100%;
    }

    /* ── Label ─────────────────────────────────────────────────── */
    .ca-tf__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-snug);
      user-select: none;
    }

    .ca-tf__req {
      color: var(--ca-semantic-error);
    }

    /* ── Input wrapper ─────────────────────────────────────────── */
    .ca-tf__wrap {
      display: flex;
      align-items: center;
      gap: var(--ca-space-2);
      height: var(--ca-control-height);
      border-radius: var(--ca-radius-control);
      padding: 0 var(--ca-space-2-5);
      background: var(--ca-field-bg);
      border: var(--ca-border-width) solid var(--ca-field-border-color);
      box-shadow: var(--ca-field-shadow);
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        box-shadow   var(--ca-duration-fast) var(--ca-ease-standard);
    }

    .ca-tf__wrap--focused {
      border-color: var(--ca-focus-ring);
      box-shadow: 0 0 0 var(--ca-border-width-focus) var(--ca-focus-ring);
    }

    .ca-tf__wrap--error {
      border-color: var(--ca-semantic-error);
      box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
    }

    .ca-tf--disabled .ca-tf__wrap {
      background: var(--ca-action-disabled-bg);
      border-color: var(--ca-outline-default);
      cursor: not-allowed;
    }

    /* ── Input ─────────────────────────────────────────────────── */
    .ca-tf__input {
      flex: 1;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--ca-font-sans);
      font-size: var(--ca-input-font-size);
      color: var(--ca-text-primary);
      padding: 0;
      line-height: 1;
      /* Remove browser autofill background */
      -webkit-text-fill-color: var(--ca-text-primary);
    }

    .ca-tf__input::placeholder {
      color: var(--ca-text-hint);
      -webkit-text-fill-color: var(--ca-text-hint);
    }

    .ca-tf__input:disabled {
      cursor: not-allowed;
      color: var(--ca-text-disabled);
      -webkit-text-fill-color: var(--ca-text-disabled);
    }

    /* Autofill override */
    .ca-tf__input:-webkit-autofill,
    .ca-tf__input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--ca-field-bg) inset;
      -webkit-text-fill-color: var(--ca-text-primary);
      caret-color: var(--ca-text-primary);
    }

    /* ── Adornments ────────────────────────────────────────────── */
    .ca-tf__adorn {
      display: flex;
      align-items: center;
      color: var(--ca-text-hint);
      flex-shrink: 0;
      line-height: 0;
    }

    .ca-tf__adorn--trail { gap: var(--ca-space-1); }

    /* Reveal toggle: sized to the field's own height inside the wrap, so it adds no layout shift;
       the global (pointer: coarse) rule in base.css extends its hit area to 44px. */
    .ca-tf__reveal {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--ca-space-7);
      height: var(--ca-space-7);
      margin-inline-end: calc(var(--ca-space-1) * -1);
      padding: 0;
      border: none;
      border-radius: var(--ca-radius-sm);
      background: transparent;
      color: var(--ca-text-hint);
      cursor: pointer;
      transition: color var(--ca-duration-fast) var(--ca-ease-standard);
    }
    .ca-tf__reveal:hover { color: var(--ca-text-primary); }
    .ca-tf__reveal:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(var(--ca-border-width-focus) * -1);
    }
    .ca-tf__reveal:disabled { cursor: not-allowed; color: var(--ca-text-disabled); }

    .ca-tf__below { font-size: var(--ca-font-size-caption); }

    /* ── Helper / error text ───────────────────────────────────── */
    .ca-tf__hint {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
    }

    .ca-tf__hint--error {
      color: var(--ca-semantic-error);
    }

    /* ── Size: sm ──────────────────────────────────────────────── */
    .ca-tf--sm .ca-tf__wrap {
      height: var(--ca-control-height-sm);
      padding: 0 var(--ca-space-2);
    }

    .ca-tf--sm .ca-tf__input {
      font-size: var(--ca-input-font-size-sm);
    }

}
</style>

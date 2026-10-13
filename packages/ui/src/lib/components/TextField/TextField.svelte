<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { uid } from '../../utils/index.js';

  interface Props {
    label?:        string;
    placeholder?:  string;
    value?:        string;
    type?:         string;
    error?:        string;
    description?:  string;
    /** @deprecated Use `description` instead */
    helperText?:   string;
    disabled?:     boolean;
    required?:     boolean;
    readonly?:     boolean;
    autocomplete?: HTMLInputAttributes["autocomplete"];
    leading?:      Snippet;
    trailing?:     Snippet;
    size?:         'sm' | 'md';
    class?:        string;
    name?:         string;
    oninput?:      (value: string) => void;
    onchange?:     (value: string) => void;
    onblur?:       (e: FocusEvent) => void;
  }

  let {
    label,
    placeholder = '',
    value        = $bindable(''),
    type         = 'text',
    error,
    description,
    helperText,
    disabled     = false,
    required     = false,
    readonly     = false,
    autocomplete,
    leading,
    trailing,
    size         = 'md',
    class: className = '',
    name,
    oninput,
    onchange,
    onblur,
  }: Props = $props();

  let focused = $state(false);
  const id    = uid('tf');
  const hint  = $derived(description ?? helperText);
</script>

<div class="ca-tf {className}" class:ca-tf--sm={size === 'sm'} class:ca-tf--error={!!error} class:ca-tf--disabled={disabled}>
  {#if label}
    <label for={id} class="ca-tf__label">
      {label}{#if required}<span class="ca-tf__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <div class="ca-tf__wrap" class:ca-tf__wrap--focused={focused} class:ca-tf__wrap--error={!!error}>
    {#if leading}
      <span class="ca-tf__adorn ca-tf__adorn--lead" aria-hidden="true">{@render leading()}</span>
    {/if}

    <input
      {id}
      {type}
      {name}
      {placeholder}
      {disabled}
      {required}
      {readonly}
      {autocomplete}
      bind:value
      class="ca-tf__input"
      aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      aria-invalid={error ? 'true' : undefined}
      onfocus={() => (focused = true)}
      onblur={(e) => { focused = false; onblur?.(e); }}
      oninput={(e) => oninput?.((e.target as HTMLInputElement).value)}
      onchange={(e) => onchange?.((e.target as HTMLInputElement).value)}
    />

    {#if trailing}
      <span class="ca-tf__adorn ca-tf__adorn--trail">{@render trailing()}</span>
    {/if}
  </div>

  {#if error}
    <p id="{id}-err" class="ca-tf__hint ca-tf__hint--error" role="alert">{error}</p>
  {:else if hint}
    <p id="{id}-hint" class="ca-tf__hint">{hint}</p>
  {/if}
</div>

<style>
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
    border-color: var(--ca-brand-main);
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-brand-main) 18%, transparent);
  }

  .ca-tf__wrap--error {
    border-color: var(--ca-semantic-error) !important;
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent) !important;
  }

  .ca-tf--disabled .ca-tf__wrap {
    opacity: 0.5;
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

</style>

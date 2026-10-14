<script lang="ts">
  import { uid } from '../../utils/index.js';

  interface Props {
    label?:       string;
    placeholder?: string;
    value?:       string;
    rows?:        number;
    minRows?:     number;
    error?:       string;
    description?: string;
    /** @deprecated Use `description` instead */
    helperText?:  string;
    disabled?:    boolean;
    required?:    boolean;
    readonly?:    boolean;
    resize?:      'none' | 'vertical' | 'horizontal' | 'both';
    class?:       string;
    name?:        string;
    oninput?:     (value: string) => void;
    onchange?:    (value: string) => void;
    onblur?:      (e: FocusEvent) => void;
  }

  let {
    label,
    placeholder = '',
    value        = $bindable(''),
    rows         = 4,
    minRows,
    error,
    description,
    helperText,
    disabled     = false,
    required     = false,
    readonly     = false,
    resize       = 'vertical',
    class: className = '',
    name,
    oninput,
    onchange,
    onblur,
  }: Props = $props();

  let focused = $state(false);
  const id    = uid('ta');
  const hint  = $derived(description ?? helperText);

  // min-height is computed in CSS from the row count so it follows density and font scale
  const minRows_ = $derived(minRows ?? rows);
</script>

<div
  class="ca-ta {className}"
  class:ca-ta--error={!!error}
  class:ca-ta--disabled={disabled}
>
  {#if label}
    <label for={id} class="ca-ta__label">
      {label}{#if required}<span class="ca-ta__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <div class="ca-ta__wrap" class:ca-ta__wrap--focused={focused} class:ca-ta__wrap--error={!!error}>
    <textarea
      {id}
      {name}
      {placeholder}
      {rows}
      {disabled}
      {required}
      {readonly}
      bind:value
      class="ca-ta__input"
      style="--ta-resize:{resize}; --ta-min-rows:{minRows_}"
      aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      aria-invalid={error ? 'true' : undefined}
      onfocus={() => (focused = true)}
      onblur={(e) => { focused = false; onblur?.(e); }}
      oninput={(e) => oninput?.((e.target as HTMLTextAreaElement).value)}
      onchange={(e) => onchange?.((e.target as HTMLTextAreaElement).value)}
    ></textarea>
  </div>

  {#if error}
    <p id="{id}-err" class="ca-ta__hint ca-ta__hint--error" role="alert">{error}</p>
  {:else if hint}
    <p id="{id}-hint" class="ca-ta__hint">{hint}</p>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* ── Root ──────────────────────────────────────────────────── */
    .ca-ta {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1);
      width: 100%;
    }

    /* ── Label ─────────────────────────────────────────────────── */
    .ca-ta__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-snug);
      user-select: none;
    }

    .ca-ta__req {
      color: var(--ca-semantic-error);
    }

    /* ── Textarea wrapper ──────────────────────────────────────── */
    .ca-ta__wrap {
      border-radius: var(--ca-radius-control);
      background: var(--ca-field-bg);
      border: var(--ca-border-width) solid var(--ca-field-border-color);
      box-shadow: var(--ca-field-shadow);
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        box-shadow   var(--ca-duration-fast) var(--ca-ease-standard);
      overflow: hidden;
    }

    .ca-ta__wrap--focused {
      border-color: var(--ca-focus-ring);
      box-shadow: 0 0 0 var(--ca-border-width-focus) var(--ca-focus-ring);
    }

    .ca-ta__wrap--error {
      border-color: var(--ca-semantic-error);
      box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
    }

    .ca-ta--disabled .ca-ta__wrap {
      background: var(--ca-action-disabled-bg);
      border-color: var(--ca-outline-default);
      cursor: not-allowed;
    }

    /* ── Textarea ──────────────────────────────────────────────── */
    .ca-ta__input {
      display: block;
      width: 100%;
      padding: var(--ca-space-2) var(--ca-space-2-5);
      background: transparent;
      border: none;
      outline: none;
      font-family: var(--ca-font-sans);
      font-size: var(--ca-input-font-size);
      color: var(--ca-text-primary);
      box-sizing: border-box;
      line-height: var(--ca-line-height-relaxed);
      -webkit-text-fill-color: var(--ca-text-primary);
      resize: var(--ta-resize, vertical);
      min-height: calc(var(--ta-min-rows) * var(--ca-space-6) + 2 * var(--ca-space-2));
    }

    .ca-ta__input::placeholder {
      color: var(--ca-text-hint);
      -webkit-text-fill-color: var(--ca-text-hint);
    }

    .ca-ta__input:disabled {
      cursor: not-allowed;
      color: var(--ca-text-disabled);
      -webkit-text-fill-color: var(--ca-text-disabled);
    }

    /* ── Helper / error text ───────────────────────────────────── */
    .ca-ta__hint {
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-secondary);
      margin: 0;
      line-height: var(--ca-line-height-snug);
    }

    .ca-ta__hint--error {
      color: var(--ca-semantic-error);
    }

}
</style>

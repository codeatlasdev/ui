<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { uid } from '../../utils/index.js';
  import { Select } from 'bits-ui';
  import { ChevronDown, Check } from '@lucide/svelte';

  interface Option {
    value:     string;
    label:     string;
    disabled?: boolean;
  }

  interface Props {
    value?:        string;
    placeholder?:  string;
    options:       Option[];
    disabled?:     boolean;
    label?:        string;
    description?:  string;
    error?:        string;
    required?:     boolean;
    size?:         'sm' | 'md';
    class?:        string;
    onchange?:     (value: string) => void;
  }

  let {
    value       = $bindable(),
    placeholder,
    options,
    disabled    = false,
    label,
    description,
    error,
    required    = false,
    size        = 'md',
    class: className = '',
    onchange,
  }: Props = $props();

  const id       = uid('sel');
  const selected = $derived(options.find(o => o.value === value)?.label ?? '');
</script>

<div class="ca-sel {className}" class:ca-sel--sm={size === 'sm'} class:ca-sel--error={!!error} class:ca-sel--disabled={disabled}>
  {#if label}
    <label for={id} class="ca-sel__label">
      {label}{#if required}<span class="ca-sel__req" aria-hidden="true"> *</span><span class="ca-sel__sr"> ({t().select.required})</span>{/if}
    </label>
  {/if}

  <Select.Root
    type="single"
    {required}
    {value}
    onValueChange={(v) => {
      if (v !== undefined) {
        value = v;
        onchange?.(v);
      }
    }}
    {disabled}
  >
    <Select.Trigger
      {id}
      class="ca-sel__trigger"
      aria-label={label ? undefined : (placeholder ?? t().select.placeholder)}
      aria-describedby={error ? `${id}-err` : description ? `${id}-hint` : undefined}
      aria-invalid={error ? 'true' : undefined}
    >
      {#snippet child({ props })}
        <!-- `aria-activedescendant` is not allowed on role=button; the highlighted option is conveyed by the listbox itself. -->
        {@const { 'aria-activedescendant': _omit, ...buttonProps } = props}
        <button {...buttonProps}>
          <span class="ca-sel__value" class:ca-sel__value--placeholder={!value}>
            {value ? selected : (placeholder ?? t().select.placeholder)}
          </span>
          <span class="ca-sel__icon" aria-hidden="true">
            <ChevronDown size={14} strokeWidth={2} />
          </span>
        </button>
      {/snippet}
    </Select.Trigger>

    <Select.Portal>
      <Select.Content class="ca-sel__content" sideOffset={4} aria-label={label ?? placeholder ?? t().select.placeholder}>
        {#each options as option}
          <Select.Item
            value={option.value}
            label={option.label}
            disabled={option.disabled}
            class="ca-sel__item"
          >
            {#snippet children({ selected: isSel })}
              <span class="ca-sel__item-label">{option.label}</span>
              {#if isSel}
                <span class="ca-sel__check" aria-hidden="true">
                  <Check size={14} strokeWidth={2.4} />
                </span>
              {/if}
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Portal>
  </Select.Root>

  {#if error}
    <p id="{id}-err" class="ca-sel__hint ca-sel__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{id}-hint" class="ca-sel__hint">{description}</p>
  {/if}
</div>

<style>
  /* ── Root ──────────────────────────────────────────────────── */
  .ca-sel {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    width: 100%;
  }

  /* ── Label ─────────────────────────────────────────────────── */
  .ca-sel__label {
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
    line-height: var(--ca-line-height-snug);
    user-select: none;
  }

  .ca-sel__req {
    color: var(--ca-semantic-error);
  }

  /* ── Trigger ───────────────────────────────────────────────── */
  :global(.ca-sel__trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
    height: var(--ca-control-height);
    padding: 0 var(--ca-space-2-5);
    border-radius: var(--ca-radius-control);
    background: var(--ca-field-bg);
    border: var(--ca-border-width) solid var(--ca-field-border-color);
    box-shadow: var(--ca-field-shadow);
    cursor: pointer;
    font-family: var(--ca-font-sans);
    font-size: var(--ca-input-font-size);
    color: var(--ca-text-primary);
    width: 100%;
    outline: none;
    transition:
      border-color var(--ca-duration-fast) var(--ca-ease-standard),
      box-shadow   var(--ca-duration-fast) var(--ca-ease-standard);
  }

  @media (pointer: coarse) {
    :global(.ca-sel__trigger) {
      height: auto;
      min-height: var(--ca-touch-target);
    }
  }

  :global(.ca-sel__trigger:hover):not(:disabled) {
    border-color: var(--ca-outline-default);
  }

  :global(.ca-sel__trigger:focus-visible),
  :global(.ca-sel__trigger[data-state='open']) {
    border-color: var(--ca-brand-main);
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-brand-main) 18%, transparent);
  }

  :global(.ca-sel__trigger[aria-invalid='true']) {
    border-color: var(--ca-semantic-error);
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
  }

  :global(.ca-sel__trigger:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ca-sel__value {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ca-sel__value--placeholder {
    color: var(--ca-text-secondary);
  }

  .ca-sel__icon {
    display: flex;
    align-items: center;
    color: var(--ca-text-hint);
    flex-shrink: 0;
  }

  /* ── Dropdown content ──────────────────────────────────────── */
  :global(.ca-sel__content) {
    z-index: var(--ca-z-dropdown);
    min-width: var(--bits-select-anchor-width);
    max-height: 280px;
    overflow-y: auto;
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-control);
    box-shadow: var(--ca-shadow-lg);
    padding: var(--ca-space-1);
    outline: none;
  }

  :global(.ca-sel__item) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ca-space-2);
    padding: var(--ca-space-1-5) var(--ca-space-2-5);
    border-radius: var(--ca-radius-sm);
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    cursor: pointer;
    user-select: none;
    outline: none;
  }

  :global(.ca-sel__item[data-highlighted]) {
    background: var(--ca-action-hover);
  }

  :global(.ca-sel__item[data-disabled]) {
    color: var(--ca-text-disabled);
    cursor: not-allowed;
  }

  :global(.ca-sel__item[data-selected]) {
    color: var(--ca-brand-text);
    font-weight: var(--ca-font-weight-medium);
  }

  .ca-sel__item-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ca-sel__check {
    color: var(--ca-brand-text);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── Hint / error ──────────────────────────────────────────── */
  .ca-sel__hint {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: var(--ca-line-height-snug);
  }

  .ca-sel__hint--error {
    color: var(--ca-semantic-error);
  }

  /* ── Size: sm ──────────────────────────────────────────────── */
  .ca-sel--sm :global(.ca-sel__trigger) {
    height: var(--ca-control-height-sm);
    padding: 0 var(--ca-space-2);
    font-size: var(--ca-input-font-size-sm);
  }
  .ca-sel__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>

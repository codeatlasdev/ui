<script lang="ts">
  import { focusTextField, primeKeyboard } from '../../actions/autofocus.js';
  import { t } from '../../i18n/state.svelte.js';
  import { uid } from '../../utils/index.js';
  import { Combobox as BitsCombobox } from 'bits-ui';
  import { ChevronDown, Check } from '@lucide/svelte';

  export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    value?:             string;
    options:            ComboboxOption[];
    placeholder?:       string;
    searchPlaceholder?: string;
    disabled?:          boolean;
    label?:             string;
    /** Accessible name when there is no visible `label`. The trigger's name becomes `ariaLabel` followed by its current value (so it still contains the visible text). */
    ariaLabel?:         string;
    class?:             string;
    error?:             string;
    description?:       string;
    required?:          boolean;
    size?:              'sm' | 'md';
    emptyText?:         string;
    onchange?:          (value: string) => void;
  }

  let {
    value             = $bindable(''),
    options,
    placeholder,
    searchPlaceholder,
    disabled          = false,
    label,
    ariaLabel,
    class: className  = '',
    error,
    description,
    required          = false,
    size              = 'md',
    emptyText,
    onchange,
  }: Props = $props();

  let query     = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);

  // The popup input owns keyboard focus (aria-activedescendant lives on it), so focus it as soon as it mounts.
  $effect(() => { focusTextField(searchInput); });
  const triggerId = uid('cbx');

  let selectedLabel = $derived(options.find(o => o.value === value)?.label ?? placeholder ?? t().combobox.placeholder);

  let filtered = $derived(
    query.trim() === ''
      ? options
      : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
  );

  let rootClass = $derived(
    ['ca-combobox', size === 'sm' ? 'ca-combobox--sm' : '', !!error ? 'ca-combobox--error' : '', className]
      .filter(Boolean).join(' ')
  );
</script>

<BitsCombobox.Root
  type="single"
  bind:value
  onValueChange={(v) => { if (v !== undefined) { value = v; onchange?.(v); } }}
  {disabled}
  onOpenChange={(open) => { if (!open) query = ''; }}
>
<div class={rootClass}>
  {#if label}
    <label for={triggerId} class="ca-combobox__label">
      {label}{#if required}<span class="ca-combobox__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <BitsCombobox.Trigger
    onclick={primeKeyboard}
    id={triggerId}
    class="ca-combobox__trigger"
    aria-labelledby={!label && ariaLabel ? `${triggerId}-name ${triggerId}-value` : undefined}
    aria-describedby={error ? `${triggerId}-err` : description ? `${triggerId}-hint` : undefined}
    aria-invalid={error ? 'true' : undefined}
  >
    {#if !label && ariaLabel}<span id="{triggerId}-name" hidden>{ariaLabel}</span>{/if}
    <span id="{triggerId}-value" class="ca-combobox__trigger-label">{selectedLabel}</span>
    <ChevronDown size={16} class="ca-combobox__chevron" />
  </BitsCombobox.Trigger>

  {#if error}
    <p id="{triggerId}-err" class="ca-combobox__hint ca-combobox__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{triggerId}-hint" class="ca-combobox__hint">{description}</p>
  {/if}

  <BitsCombobox.Portal>
    <BitsCombobox.Content
      sideOffset={4}
      customAnchor={`#${triggerId}`}
    >
      {#snippet child({ props, wrapperProps })}
        <!-- The popup is a plain container: the search input (role=combobox) must not live inside role=listbox. -->
        {@const { role: _role, 'aria-multiselectable': _multi, id, ...popupProps } = props}
        {@const listboxId = String(id)}
        <div {...wrapperProps}>
          <div {...popupProps} class="ca-combobox__content">
            <div class="ca-combobox__search-wrap">
              <BitsCombobox.Input
                oninput={(e) => (query = e.currentTarget.value)}
                bind:ref={searchInput}
                class="ca-combobox__input"
                placeholder={searchPlaceholder ?? t().combobox.searchPlaceholder}
                aria-label={searchPlaceholder ?? t().combobox.searchPlaceholder}
                aria-controls={listboxId}
              />
            </div>
            <div id={listboxId} role="listbox" aria-label={label ?? ariaLabel ?? placeholder ?? t().combobox.placeholder} class="ca-combobox__viewport">
              {#each filtered as opt}
                <BitsCombobox.Item
                  value={opt.value}
                  label={opt.label}
                  disabled={opt.disabled}
                  class="ca-combobox__item"
                >
                  {#snippet children({ selected })}
                    <span class="ca-combobox__item-label">{opt.label}</span>
                    {#if selected}
                      <Check size={14} class="ca-combobox__item-check" />
                    {/if}
                  {/snippet}
                </BitsCombobox.Item>
              {/each}
            </div>
            {#if filtered.length === 0}
              <div class="ca-combobox__empty">{emptyText ?? t().combobox.empty}</div>
            {/if}
          </div>
        </div>
      {/snippet}
    </BitsCombobox.Content>
  </BitsCombobox.Portal>
</div>
</BitsCombobox.Root>

<style>
  :global(.ca-combobox) {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1, 4px);
    width: 100%;
  }

  /* ── Label ─────────────────────────────────────────────────── */
  :global(.ca-combobox__label) {
    display: block;
    font-size: var(--ca-font-size-body2);
    font-weight: 500;
    color: var(--ca-text-primary);
    line-height: 1.4;
    user-select: none;
  }

  :global(.ca-combobox__req) {
    color: var(--ca-semantic-error);
  }

  /* ── Trigger ───────────────────────────────────────────────── */
  :global(.ca-combobox__trigger) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 10px;
    height: 36px;
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-raised);
    border: 1px solid var(--ca-outline-subtle);
    cursor: pointer;
    font-size: var(--ca-input-font-size);
    color: var(--ca-text-primary);
    font-family: inherit;
    text-align: left;
    transition:
      border-color var(--ca-duration-fast) var(--ca-ease-standard),
      box-shadow   var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-combobox__trigger:hover) {
    border-color: var(--ca-outline-default);
  }

  :global(.ca-combobox__trigger[data-state="open"]) {
    border-color: var(--ca-brand-main);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--ca-brand-main) 18%, transparent);
  }

  :global(.ca-combobox--error .ca-combobox__trigger) {
    border-color: var(--ca-semantic-error) !important;
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--ca-semantic-error) 18%, transparent) !important;
  }

  :global(.ca-combobox__trigger-label) {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.ca-combobox__chevron) {
    color: var(--ca-text-hint);
    flex-shrink: 0;
    transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-combobox__trigger[data-state="open"] .ca-combobox__chevron) {
    transform: rotate(180deg);
  }

  /* ── Size: sm ──────────────────────────────────────────────── */
  :global(.ca-combobox--sm .ca-combobox__trigger) {
    height: 30px;
    padding: 0 8px;
    font-size: var(--ca-font-size-caption);
  }

  /* ── Helper / error text ───────────────────────────────────── */
  :global(.ca-combobox__hint) {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  :global(.ca-combobox__hint--error) {
    color: var(--ca-semantic-error);
  }

  /* ── Dropdown content ──────────────────────────────────────── */
  :global(.ca-combobox__content) {
    z-index: var(--ca-z-dropdown);
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-overlay);
    border: 1px solid var(--ca-outline-subtle);
    box-shadow: var(--ca-shadow-lg);
    overflow: hidden;
    min-width: var(--bits-combobox-trigger-width, 200px);
    outline: none;
  }

  .ca-combobox__search-wrap {
    padding: 8px;
    border-bottom: 1px solid var(--ca-outline-subtle);
  }

  :global(.ca-combobox__input) {
    width: 100%;
    padding: 6px 10px;
    border-radius: var(--ca-radius-sm);
    border: 1px solid var(--ca-outline-subtle);
    background: var(--ca-action-hover);
    font-size: var(--ca-input-font-size);
    color: var(--ca-text-primary);
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }

  :global(.ca-combobox__input:focus) {
    border-color: var(--ca-brand-main);
  }

  :global(.ca-combobox__viewport) {
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }

  :global(.ca-combobox__item) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: var(--ca-radius-sm);
    cursor: pointer;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-primary);
    outline: none;
    transition: background var(--ca-duration-fast) var(--ca-ease-standard);
  }

  :global(.ca-combobox__item[data-highlighted]) {
    background: var(--ca-action-hover);
  }

  :global(.ca-combobox__item[data-disabled]) {
    opacity: 0.5;
    pointer-events: none;
  }

  :global(.ca-combobox__item-check) {
    color: var(--ca-brand-text);
    flex-shrink: 0;
  }

  .ca-combobox__empty {
    padding: 16px 10px;
    text-align: center;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-hint);
  }

</style>

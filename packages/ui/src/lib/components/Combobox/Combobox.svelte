<script lang="ts">
  import { focusTextField, primeKeyboard } from '../../actions/autofocus.js';
  import { t } from '../../i18n/state.svelte.js';
  import { uid } from '../../utils/index.js';
  import { createListbox } from '../../primitives/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
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
  let open = $state(false);
  let trigger = $state<HTMLElement | null>(null);
  let popup = $state<HTMLElement | null>(null);

  const triggerId = uid('cbx');
  const listboxId = `${triggerId}-list`;

  // The popup input owns keyboard focus (aria-activedescendant lives on it), so focus it as soon as it mounts.
  $effect(() => { focusTextField(searchInput); });

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

  const listbox = createListbox({
    mode: 'activedescendant',
    spaceSelects: false,
    items: () =>
      filtered.map((o, i) => ({
        id: `${triggerId}-opt-${i}`,
        el: () => popup?.querySelector<HTMLElement>(`#${CSS.escape(`${triggerId}-opt-${i}`)}`),
        text: o.label,
        disabled: o.disabled,
      })),
    onSelect: (_item, i) => choose(filtered[i]),
  });

  // Typing changes the result set: restart the highlight on the first match.
  $effect(() => {
    void filtered;
    if (open) listbox.first();
  });

  function choose(option: ComboboxOption | undefined) {
    if (!option || option.disabled) return;
    value = option.value;
    onchange?.(option.value);
    close();
  }

  function close(restoreFocus = true) {
    open = false;
    query = '';
    listbox.clear();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') return close(false);
    listbox.onkeydown(e);
  }
</script>

<div class={rootClass}>
  {#if label}
    <label for={triggerId} class="ca-combobox__label">
      {label}{#if required}<span class="ca-combobox__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}

  <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
  <button
    type="button"
    bind:this={trigger}
    id={triggerId}
    class="ca-combobox__trigger"
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? `${triggerId}-popup` : undefined}
    aria-labelledby={!label && ariaLabel ? `${triggerId}-name ${triggerId}-value` : undefined}
    aria-describedby={error ? `${triggerId}-err` : description ? `${triggerId}-hint` : undefined}
    aria-invalid={error ? 'true' : undefined}
    data-state={open ? 'open' : 'closed'}
    onclick={() => {
      if (open) return close();
      primeKeyboard();
      open = true;
    }}
    onkeydown={(e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) open = true;
      }
    }}
  >
    {#if !label && ariaLabel}<span id="{triggerId}-name" hidden>{ariaLabel}</span>{/if}
    <span id="{triggerId}-value" class="ca-combobox__trigger-label">{selectedLabel}</span>
    <ChevronDown size={16} class="ca-combobox__chevron" />
  </button>
  {#if required}
    <!-- Native constraint validation for <form required>: blocks submit while empty and moves focus to
         the trigger. Not a form value carrier: there is no `name` prop. -->
    <input
      class="ca-validity-proxy"
      tabindex="-1"
      aria-hidden="true"
      required
      value={value ?? ''}
      oninvalid={(e) => { e.preventDefault(); trigger?.focus(); }}
    />
  {/if}

  {#if error}
    <p id="{triggerId}-err" class="ca-combobox__hint ca-combobox__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{triggerId}-hint" class="ca-combobox__hint">{description}</p>
  {/if}

  <!-- The popup is a plain container: the search input (role=combobox) must not live inside role=listbox. -->
  <FloatingLayer
    anchor={trigger}
    {open}
    side="bottom"
    align="start"
    sideOffset={4}
    sameWidth
    bind:ref={popup}
    id="{triggerId}-popup"
    class="ca-combobox__content"
    onDismiss={(reason) => close(reason === 'escape')}
  >
    <div class="ca-combobox__search-wrap">
      <input
        bind:this={searchInput}
        bind:value={query}
        type="text"
        role="combobox"
        class="ca-combobox__input"
        autocomplete="off"
        placeholder={searchPlaceholder ?? t().combobox.searchPlaceholder}
        aria-label={searchPlaceholder ?? t().combobox.searchPlaceholder}
        aria-controls={listboxId}
        aria-expanded="true"
        aria-autocomplete="list"
        aria-activedescendant={listbox.activeDescendant}
        onkeydown={onInputKeydown}
      />
    </div>
    <div id={listboxId} role="listbox" aria-label={label ?? ariaLabel ?? placeholder ?? t().combobox.placeholder} class="ca-combobox__viewport">
      {#each filtered as opt, i (opt.value)}
        <!-- Keyboard is handled by the search input (aria-activedescendant); options are not tab stops. -->
        <!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
        <div
          id="{triggerId}-opt-{i}"
          role="option"
          class="ca-combobox__item"
          aria-selected={opt.value === value}
          aria-disabled={opt.disabled ? 'true' : undefined}
          data-disabled={opt.disabled ? '' : undefined}
          data-highlighted={listbox.isHighlighted(i) ? '' : undefined}
          data-selected={opt.value === value ? '' : undefined}
          onclick={() => choose(opt)}
          onpointermove={() => !opt.disabled && listbox.highlight(i)}
        >
          <span class="ca-combobox__item-label">{opt.label}</span>
          {#if opt.value === value}
            <Check size={14} class="ca-combobox__item-check" />
          {/if}
        </div>
      {/each}
    </div>
    {#if filtered.length === 0}
      <div class="ca-combobox__empty">{emptyText ?? t().combobox.empty}</div>
    {/if}
  </FloatingLayer>
</div>

<style>
  :global(.ca-combobox) {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-1);
    width: 100%;
  }

  /* ── Label ─────────────────────────────────────────────────── */
  :global(.ca-combobox__label) {
    display: block;
    font-size: var(--ca-font-size-label);
    font-weight: var(--ca-font-weight-medium);
    color: var(--ca-text-primary);
    line-height: var(--ca-line-height-snug);
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
    padding: 0 var(--ca-space-2-5);
    height: var(--ca-control-height);
    border-radius: var(--ca-radius-control);
    background: var(--ca-field-bg);
    border: var(--ca-border-width) solid var(--ca-field-border-color);
    box-shadow: var(--ca-field-shadow);
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
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-brand-main) 18%, transparent);
  }

  :global(.ca-combobox--error .ca-combobox__trigger) {
    border-color: var(--ca-semantic-error) !important;
    box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent) !important;
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
    height: var(--ca-control-height-sm);
    padding: 0 var(--ca-space-2);
    font-size: var(--ca-input-font-size-sm);
  }

  /* ── Helper / error text ───────────────────────────────────── */
  :global(.ca-combobox__hint) {
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    margin: 0;
    line-height: var(--ca-line-height-snug);
  }

  :global(.ca-combobox__hint--error) {
    color: var(--ca-semantic-error);
  }

  /* ── Dropdown content ──────────────────────────────────────── */
  :global(.ca-combobox__content) {
    border-radius: var(--ca-radius-lg);
    background: var(--ca-surface-overlay);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
    box-shadow: var(--ca-shadow-lg);
    overflow: hidden;
    min-width: var(--ca-anchor-width, 200px);
    outline: none;
  }

  .ca-combobox__search-wrap {
    padding: var(--ca-space-2);
    border-bottom: var(--ca-border-width) solid var(--ca-outline-subtle);
  }

  :global(.ca-combobox__input) {
    width: 100%;
    padding: var(--ca-space-1-5) var(--ca-space-2-5);
    border-radius: var(--ca-radius-sm);
    border: var(--ca-border-width) solid var(--ca-outline-subtle);
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
    padding: var(--ca-space-1);
  }

  :global(.ca-combobox__item) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ca-space-2) var(--ca-space-2-5);
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
    padding: var(--ca-space-4) var(--ca-space-2-5);
    text-align: center;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-hint);
  }


  .ca-validity-proxy {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
</style>

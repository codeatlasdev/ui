<script lang="ts">
  import { focusTextField, primeKeyboard } from '../../actions/autofocus.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { chip } from '../../i18n/groups/chip.js';
  import { combobox } from '../../i18n/groups/combobox.js';
  import { uid } from '../../utils/index.js';
  import { createListbox } from '../../primitives/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { ChevronDown, Check, X } from '@lucide/svelte';
  const t = useMessages(chip, combobox);

  export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    /** When `true`, `value` is `string[]` and the list stays open after each pick. */
    multiple?:          boolean;
    value?:             string | string[];
    options:            ComboboxOption[];
    placeholder?:       string;
    searchPlaceholder?: string;
    disabled?:          boolean;
    label?:             string;
    /** Accessible name when there is no visible `label`. */
    ariaLabel?:         string;
    class?:             string;
    error?:             string;
    description?:       string;
    required?:          boolean;
    size?:              'sm' | 'md';
    emptyText?:         string;
    onchange?:          (value: string | string[]) => void;
    /** Called when a new tag is created via `creatable`. Receives the new value string. */
    oncreate?:          (value: string) => void;
    /** Show a "Create …" option when the query doesn't match any existing option exactly. */
    creatable?:         boolean;
  }

  let {
    value             = $bindable<string | string[] | undefined>(undefined),
    multiple          = false,
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
    oncreate,
    creatable         = false,
  }: Props = $props();

  // ── Selection ──────────────────────────────────────────────────────────────
  let selectedValues = $derived<string[]>(
    multiple
      ? (Array.isArray(value) ? value : [])
      : (typeof value === 'string' && value ? [value] : [])
  );

  function isSelected(v: string) {
    return selectedValues.includes(v);
  }

  function writeValue(next: string[]) {
    if (multiple) {
      value = next;
      onchange?.(next);
    } else {
      value = next[0] ?? '';
      onchange?.(next[0] ?? '');
    }
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let query       = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);
  let open        = $state(false);
  let trigger     = $state<HTMLElement | null>(null);
  let popup       = $state<HTMLElement | null>(null);

  const triggerId = uid('cbx');
  const listboxId = `${triggerId}-list`;

  $effect(() => { focusTextField(searchInput); });

  // ── Label for the trigger (single mode) ──────────────────────────────────
  let selectedLabel = $derived(
    multiple
      ? (selectedValues.length === 0 ? (placeholder ?? t().combobox.placeholder) : '')
      : (options.find(o => o.value === (value as string))?.label ?? placeholder ?? t().combobox.placeholder)
  );

  // ── Filtered options ──────────────────────────────────────────────────────
  let trimmedQuery = $derived(query.trim().toLowerCase());

  let filtered = $derived(
    trimmedQuery === ''
      ? options
      : options.filter(o => o.label.toLowerCase().includes(trimmedQuery))
  );

  // Show "Create …" row when creatable, query is non-empty, and no exact match
  let showCreate = $derived(
    !!creatable &&
    trimmedQuery !== '' &&
    !options.some(o => o.label.toLowerCase() === trimmedQuery)
  );

  // All items fed into the listbox: filtered options + optional create row
  interface CreateRow { _create: true; label: string; value: string }
  type Row = ComboboxOption | CreateRow;
  let rows = $derived<Row[]>(
    showCreate
      ? [...filtered, { _create: true, label: t().combobox.create(query.trim()), value: query.trim() } as CreateRow]
      : filtered
  );

  let rootClass = $derived(
    ['ca-combobox', multiple ? 'ca-combobox--multiple' : '', size === 'sm' ? 'ca-combobox--sm' : '', !!error ? 'ca-combobox--error' : '', className]
      .filter(Boolean).join(' ')
  );

  // ── Listbox primitive ─────────────────────────────────────────────────────
  const listbox = createListbox({
    mode: 'activedescendant',
    spaceSelects: false,
    items: () =>
      rows.map((row, i) => ({
        id: `${triggerId}-opt-${i}`,
        el: () => popup?.querySelector<HTMLElement>(`#${CSS.escape(`${triggerId}-opt-${i}`)}`),
        text: row.label,
        disabled: (row as ComboboxOption).disabled,
      })),
    onSelect: (_item, i) => choose(rows[i]),
  });

  $effect(() => {
    void filtered;
    if (open) listbox.first();
  });

  // ── Choose ────────────────────────────────────────────────────────────────
  function choose(row: Row) {
    if (!row) return;
    if ((row as ComboboxOption).disabled) return;

    if ('_create' in row && row._create) {
      // creatable: add new tag
      const newVal = row.value;
      writeValue(multiple ? [...selectedValues, newVal] : [newVal]);
      oncreate?.(newVal);
      query = '';
      if (multiple) listbox.first(); else close();
      return;
    }

    const opt = row as ComboboxOption;
    if (multiple) {
      const already = selectedValues.includes(opt.value);
      const next = already
        ? selectedValues.filter(v => v !== opt.value)
        : [...selectedValues, opt.value];
      writeValue(next);
      query = '';
      listbox.first();
      // keep open in multiple mode
    } else {
      writeValue([opt.value]);
      close();
    }
  }

  function removeChip(val: string) {
    writeValue(selectedValues.filter(v => v !== val));
  }

  function close(restoreFocus = true) {
    open = false;
    query = '';
    listbox.clear();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') return close(false);
    if (e.key === 'Backspace' && query === '' && multiple && selectedValues.length > 0) {
      removeChip(selectedValues[selectedValues.length - 1]);
      return;
    }
    listbox.onkeydown(e);
  }
</script>

<div class={rootClass}>
  {#if label}
    <label for={triggerId} class="ca-combobox__label">
      {label}{#if required}<span class="ca-combobox__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}
  {#if multiple && selectedValues.length > 0}
    <div class="ca-combobox__chips" role="group" aria-label={t().combobox.selectedValues}>
      {#each selectedValues as val (val)}
        {@const chipLabel = options.find(o => o.value === val)?.label ?? val}
        <span class="ca-chip ca-chip--sm ca-combobox__chip">
          <span class="ca-chip__label">{chipLabel}</span>
          <button
            type="button"
            class="ca-chip__delete"
            aria-label={t().chip.remove(chipLabel)}
            onclick={() => removeChip(val)}
          ><X size={12} stroke-width={2} /></button>
        </span>
      {/each}
    </div>
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
    <span id="{triggerId}-value" class="ca-combobox__trigger-label">
      {#if multiple && selectedValues.length > 0}
        <span class="ca-combobox__trigger-count" aria-hidden="true">{t().combobox.selectedCount(selectedValues.length)}</span>
      {:else}
        {selectedLabel}
      {/if}
    </span>
    <ChevronDown size={16} class="ca-combobox__chevron" />
  </button>
  {#if required}
    <input
      class="ca-validity-proxy"
      tabindex="-1"
      aria-hidden="true"
      required
      value={selectedValues[0] ?? ''}
      oninvalid={(e) => { e.preventDefault(); trigger?.focus(); }}
    />
  {/if}

  {#if error}
    <p id="{triggerId}-err" class="ca-combobox__hint ca-combobox__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{triggerId}-hint" class="ca-combobox__hint">{description}</p>
  {/if}

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
    <div
      id={listboxId}
      role="listbox"
      aria-label={label ?? ariaLabel ?? placeholder ?? t().combobox.placeholder}
      aria-multiselectable={multiple ? 'true' : undefined}
      class="ca-combobox__viewport"
    >
      {#each rows as row, i (row.value)}
        {@const isCreate = '_create' in row && row._create}
        {@const selected = !isCreate && isSelected((row as ComboboxOption).value)}
        <!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
        <div
          id="{triggerId}-opt-{i}"
          role="option"
          class="ca-combobox__item"
          class:ca-combobox__item--create={isCreate}
          aria-selected={selected}
          aria-disabled={(row as ComboboxOption).disabled ? 'true' : undefined}
          data-disabled={(row as ComboboxOption).disabled ? '' : undefined}
          data-highlighted={listbox.isHighlighted(i) ? '' : undefined}
          data-selected={selected ? '' : undefined}
          onclick={() => choose(row)}
          onpointermove={() => !(row as ComboboxOption).disabled && listbox.highlight(i)}
        >
          <span class="ca-combobox__item-label">{row.label}</span>
          {#if selected}
            <Check size={14} class="ca-combobox__item-check" />
          {/if}
        </div>
      {/each}
    </div>
    {#if rows.length === 0}
      <div class="ca-combobox__empty">{emptyText ?? t().combobox.empty}</div>
    {/if}
  </FloatingLayer>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
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

    /* ── Chips row (multiple mode) ──────────────────────────────── */
    :global(.ca-combobox__chips) {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ca-space-1);
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
      border-color: var(--ca-outline-strong);
    }

    :global(.ca-combobox__trigger[data-state="open"]) {
      border-color: var(--ca-focus-ring);
      box-shadow: 0 0 0 var(--ca-border-width-focus) var(--ca-focus-ring);
    }

    :global(.ca-combobox--error .ca-combobox__trigger) {
      border-color: var(--ca-semantic-error);
      box-shadow: 0 0 0 var(--ca-border-width-focus) color-mix(in oklab, var(--ca-semantic-error) 18%, transparent);
    }

    :global(.ca-combobox__trigger-label) {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :global(.ca-combobox__trigger-count) {
      color: var(--ca-brand-text);
      font-weight: var(--ca-font-weight-medium);
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
      border-color: var(--ca-focus-ring);
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
      color: var(--ca-text-disabled);
      pointer-events: none;
    }

    :global(.ca-combobox__item-check) {
      color: var(--ca-brand-text);
      flex-shrink: 0;
    }

    :global(.ca-combobox__item--create) {
      color: var(--ca-brand-text);
      font-style: italic;
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

    /* forced-colors */
    @media (forced-colors: active) {
      :global(.ca-combobox__chips) { gap: var(--ca-space-1); }
      :global(.ca-combobox__chip)  { border-color: CanvasText; }
    }
}
</style>

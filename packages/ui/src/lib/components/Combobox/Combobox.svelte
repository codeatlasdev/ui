<script lang="ts">
  import { focusTextField, primeKeyboard } from '../../actions/autofocus.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { combobox } from '../../i18n/groups/combobox.js';
  import { uid } from '../../utils/index.js';
  import { fieldWidth, type FieldWidth } from '../../utils/field-width.js';
  import type { FieldVariant } from '../../theme/components.js';
  import '../field-variant.css';
  import { createListbox } from '../../primitives/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { ChevronDown, Check } from '@lucide/svelte';
  import Highlight from '../Highlight/Highlight.svelte';
  import Chip from '../Chip/Chip.svelte';
  import { fold, rankMatches, splitMatch } from './match.js';
  const t = useMessages(combobox);

  export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    /** Section header this option sits under. Consecutive visible options with the same `group` share one `role="group"`; a group with no match for the query is hidden with its header. Options without one render ungrouped. */
    group?: string;
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
    /** Keeps `label` for assistive tech only (`.ca-sr-only`), for a field in a toolbar, table or grid that already shows its name. */
    hideLabel?:         boolean;
    /** `full` (default) fills the row; `auto` and `fit` size to the content; any CSS length sets the width. Written to `--ca-field-width`, so a `Toolbar` sets it for every field inside. */
    width?:               FieldWidth;
    /** Accessible name when there is no visible `label`. */
    ariaLabel?:         string;
    class?:             string;
    error?:             string;
    description?:       string;
    required?:          boolean;
    size?:              'sm' | 'md';
    /** How the field is drawn: `outlined` (the style's own), `filled` or `underline`. Default follows the theme (`components.field.variant`). */
    variant?:              FieldVariant;
    emptyText?:         string;
    onchange?:          (value: string | string[]) => void;
    /** Called when a new tag is created via `creatable`. Receives the new value string. */
    oncreate?:          (value: string) => void;
    /** Show a "Create …" option when the query doesn't match any existing option exactly. */
    creatable?:         boolean;
    /** Multiple mode: show "N selected" in the trigger instead of the placeholder. Default `false` (the chips already list the selection). */
    showCount?:         boolean;
  }

  let {
    value             = $bindable<string | string[] | undefined>(undefined),
    multiple          = false,
    options,
    placeholder,
    searchPlaceholder,
    disabled          = false,
    label,
    hideLabel         = false,
    width,
    ariaLabel,
    class: className  = '',
    error,
    description,
    required          = false,
    size              = 'md',
    variant,
    emptyText,
    onchange,
    oncreate,
    creatable         = false,
    showCount         = false,
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
      ? (placeholder ?? t().combobox.placeholder)
      : (options.find(o => o.value === (value as string))?.label ?? placeholder ?? t().combobox.placeholder)
  );

  // ── Filtered options ──────────────────────────────────────────────────────
  let trimmedQuery = $derived(fold(query.trim()));

  let filtered = $derived(rankMatches(options, query, o => o.label));

  // Show "Create …" row when creatable, query is non-empty, and no exact match
  let showCreate = $derived(
    !!creatable &&
    trimmedQuery !== '' &&
    !options.some(o => fold(o.label) === trimmedQuery)
  );

  // All items fed into the listbox: filtered options + optional create row
  interface CreateRow { _create: true; label: string; value: string }
  type Row = ComboboxOption | CreateRow;
  // Grouped options are gathered under their group (placed where it first appears) so that list order, listbox
  // index and visual order agree; ungrouped options keep their place. Without any `group` this is `filtered`.
  let ordered = $derived.by(() => {
    if (!filtered.some(o => o.group !== undefined)) return filtered;
    const out: ComboboxOption[] = [];
    const placed = new Set<string>();
    for (const o of filtered) {
      if (o.group === undefined) out.push(o);
      else if (!placed.has(o.group)) {
        placed.add(o.group);
        out.push(...filtered.filter(x => x.group === o.group));
      }
    }
    return out;
  });
  let rows = $derived<Row[]>(
    showCreate
      ? [...ordered, { _create: true, label: t().combobox.create(query.trim()), value: query.trim() } as CreateRow]
      : ordered
  );

  // `rows` already has each group contiguous, so a section is a run of equal `group`. `i` stays the index into
  // `rows`, which the listbox navigates, so headers are never highlighted or typed to. A group with no match
  // has no rows, hence no section and no header. Ungrouped rows (and "Create …") are not wrapped.
  let sections = $derived.by(() => {
    const out: { key: number; group: string | undefined; items: { row: Row; i: number }[] }[] = [];
    rows.forEach((row, i) => {
      const group = '_create' in row ? undefined : (row as ComboboxOption).group;
      const last = out[out.length - 1];
      if (last && last.group === group) last.items.push({ row, i });
      else out.push({ key: i, group, items: [{ row, i }] });
    });
    return out;
  });

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
    // Printable keys belong to the field (it filters by text); only navigation keys reach the listbox.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) return;
    listbox.onkeydown(e);
  }
</script>

<div class={rootClass} style:--ca-field-width={fieldWidth(width)} data-ca-field={variant}>
  {#if label}
    <label for={triggerId} class="ca-combobox__label" class:ca-sr-only={hideLabel}>
      {label}{#if required}<span class="ca-combobox__req" aria-hidden="true"> *</span>{/if}
    </label>
  {/if}
  {#if multiple && selectedValues.length > 0}
    <div class="ca-combobox__chips" role="group" aria-label={t().combobox.selectedValues}>
      {#each selectedValues as val (val)}
        {@const chipLabel = options.find(o => o.value === val)?.label ?? val}
        <!-- The real Chip (#1086): its CSS is scoped, so hand-written `ca-chip` markup rendered unstyled. -->
        <Chip label={chipLabel} size="sm" deletable ondelete={() => removeChip(val)} class="ca-combobox__chip" />
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
      {#if multiple && showCount && selectedValues.length > 0}
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

  {#snippet optionRow(row: Row, i: number)}
    {@const isCreate = '_create' in row && row._create}
    {@const selected = !isCreate && isSelected((row as ComboboxOption).value)}
    {@const parts = isCreate ? null : splitMatch(row.label, query)}
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
      <span class="ca-combobox__item-label">{#if parts}{parts[0]}<Highlight>{parts[1]}</Highlight>{parts[2]}{:else}{row.label}{/if}</span>
      {#if selected}
        <Check size={14} class="ca-combobox__item-check" />
      {/if}
    </div>
  {/snippet}

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
      {#each sections as section (section.key)}
        {#if section.group !== undefined}
          <div class="ca-combobox__group" role="group" aria-labelledby="{triggerId}-grp-{section.key}">
            <div id="{triggerId}-grp-{section.key}" class="ca-combobox__group-label">{section.group}</div>
            {#each section.items as item (item.row.value)}
              {@render optionRow(item.row, item.i)}
            {/each}
          </div>
        {:else}
          {#each section.items as item (item.row.value)}
            {@render optionRow(item.row, item.i)}
          {/each}
        {/if}
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
      gap: var(--ca-cb-gap, var(--ca-field-gap, var(--ca-space-1)));
      width: var(--ca-field-width, 100%);
      min-width: var(--ca-field-min-width, 0);
    }

    /* ── Label ─────────────────────────────────────────────────── */
    :global(.ca-combobox__label) {
      display: block;
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-cb-label-line-height, var(--ca-field-label-leading, var(--ca-line-height-snug)));
      letter-spacing: var(--ca-cb-label-tracking, var(--ca-field-label-tracking, inherit));
      user-select: none;
    }

    :global(.ca-combobox__req) {
      color: var(--ca-field-required-color, var(--ca-semantic-error));
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
      border-radius: var(--ca-field-radius, var(--ca-radius-control));
      background: var(--ca-field-bg);
      border: var(--ca-field-border-width, var(--ca-border-width)) solid var(--ca-field-border-color);
      box-shadow: var(--ca-field-shadow);
      cursor: pointer;
      font-size: var(--ca-input-font-size);
      letter-spacing: var(--ca-cb-letter-spacing, var(--ca-input-letter-spacing, inherit));
      line-height: var(--ca-cb-line-height, var(--ca-input-line-height, inherit));
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
      color: var(--ca-field-hint-color, var(--ca-text-secondary));
      margin: 0;
      line-height: var(--ca-cb-hint-leading, var(--ca-field-hint-leading, var(--ca-line-height-snug)));
      letter-spacing: var(--ca-cb-hint-tracking, var(--ca-field-hint-tracking, inherit));
    }

    :global(.ca-combobox__hint--error) {
      color: var(--ca-semantic-error);
    }

    /* ── Dropdown content ──────────────────────────────────────── */
    :global(.ca-combobox__content) {
      border-radius: var(--ca-radius-lg);
      background: var(--ca-surface-floating, var(--ca-surface-overlay));
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

    :global(.ca-combobox__group-label) {
      padding: var(--ca-space-1-5) var(--ca-space-2-5) var(--ca-space-1);
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-secondary);
      user-select: none;
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

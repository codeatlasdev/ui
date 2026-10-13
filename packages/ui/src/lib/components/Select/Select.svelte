<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
  import { uid } from '../../utils/index.js';
  import { createListbox } from '../../primitives/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
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

  let open = $state(false);
  let trigger = $state<HTMLElement | null>(null);
  let list = $state<HTMLElement | null>(null);

  const listbox = createListbox({
    mode: 'activedescendant',
    items: () =>
      options.map((o, i) => ({
        id: `${id}-opt-${i}`,
        el: () => list?.querySelector<HTMLElement>(`#${CSS.escape(`${id}-opt-${i}`)}`),
        text: o.label,
        disabled: o.disabled,
      })),
    onSelect: (_item, i) => choose(options[i]),
  });

  function choose(option: Option | undefined) {
    if (!option || option.disabled) return;
    value = option.value;
    onchange?.(option.value);
    close();
  }

  function close(restoreFocus = true) {
    open = false;
    listbox.clear();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  function openList() {
    if (disabled) return;
    open = true;
  }

  function onMounted(el: HTMLElement) {
    el.focus({ preventScroll: true });
    const at = options.findIndex((o) => o.value === value && !o.disabled);
    if (at >= 0) listbox.highlight(at);
    else listbox.first();
  }

  function onTriggerKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) openList();
    }
  }

  function onListKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') return close(false);
    listbox.onkeydown(e);
  }
</script>

<div class="ca-sel {className}" class:ca-sel--sm={size === 'sm'} class:ca-sel--error={!!error} class:ca-sel--disabled={disabled}>
  {#if label}
    <label for={id} class="ca-sel__label">
      {label}{#if required}<span class="ca-sel__req" aria-hidden="true"> *</span><span class="ca-sel__sr"> ({t().select.required})</span>{/if}
    </label>
  {/if}

  <!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
  <button
    type="button"
    {id}
    bind:this={trigger}
    class="ca-sel__trigger"
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? `${id}-list` : undefined}
    aria-label={label ? undefined : (placeholder ?? t().select.placeholder)}
    aria-describedby={error ? `${id}-err` : description ? `${id}-hint` : undefined}
    aria-invalid={error ? 'true' : undefined}
    data-state={open ? 'open' : 'closed'}
    data-placeholder={value ? undefined : ''}
    onclick={() => (open ? close() : openList())}
    onkeydown={onTriggerKeydown}
  >
    <span class="ca-sel__value" class:ca-sel__value--placeholder={!value}>
      {value ? selected : (placeholder ?? t().select.placeholder)}
    </span>
    <span class="ca-sel__icon" aria-hidden="true">
      <ChevronDown size={14} strokeWidth={2} />
    </span>
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

  <FloatingLayer
    anchor={trigger}
    {open}
    side="bottom"
    align="start"
    sideOffset={4}
    sameWidth
    bind:ref={list}
    id="{id}-list"
    role="listbox"
    tabindex={-1}
    aria-label={label ?? placeholder ?? t().select.placeholder}
    class="ca-sel__content"
    onDismiss={(reason) => close(reason === 'escape')}
    onkeydown={onListKeydown}
    {onMounted}
  >
    {#each options as option, i (option.value)}
      <!-- Keyboard is handled by the listbox container (aria-activedescendant); options are not tab stops. -->
      <!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
      <div
        id="{id}-opt-{i}"
        role="option"
        class="ca-sel__item"
        aria-selected={option.value === value}
        aria-disabled={option.disabled ? 'true' : undefined}
        data-disabled={option.disabled ? '' : undefined}
        data-highlighted={listbox.isHighlighted(i) ? '' : undefined}
        data-selected={option.value === value ? '' : undefined}
        onclick={() => choose(option)}
        onpointermove={() => !option.disabled && listbox.highlight(i)}
      >
        <span class="ca-sel__item-label">{option.label}</span>
        {#if option.value === value}
          <span class="ca-sel__check" aria-hidden="true">
            <Check size={14} strokeWidth={2.4} />
          </span>
        {/if}
      </div>
    {/each}
  </FloatingLayer>

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
    min-width: var(--ca-anchor-width);
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

  .ca-validity-proxy {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
</style>

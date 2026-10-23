<script lang="ts">
  import { Check } from '@lucide/svelte';

  export interface ChipGroupItem {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    /** Selected value. `''` means nothing selected. */
    value?: string;
    items: ChipGroupItem[];
    /** Visible title of the group; it is also the group's accessible name. */
    label?: string;
    /** Keeps `label` for assistive tech only (`.ca-sr-only`). */
    hideLabel?: boolean;
    description?: string;
    /** Field-level error: shown with `role="alert"`, sets `aria-invalid` and `aria-describedby` on the group. */
    error?: string;
    /** Native `name` of the radios, so the value is part of `FormData` on a plain form submit. */
    name?: string;
    /** Native `required`: a plain form blocks submit until a chip is picked. */
    required?: boolean;
    disabled?: boolean;
    class?: string;
    /** Accessible name when there is no visible `label`. */
    'aria-label'?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    items,
    label,
    hideLabel = false,
    description,
    error,
    name,
    required = false,
    disabled = false,
    class: className = '',
    'aria-label': ariaLabel,
    onchange,
  }: Props = $props();

  // Per-instance ids: two groups with the same values on one page must not share label targets.
  // Without `name` the id is the native radios' name: that is what makes them one group.
  const uid = $props.id();
  const groupName = $derived(name ?? uid);
  const describedBy = $derived(error ? `${uid}-err` : description ? `${uid}-hint` : undefined);

  function select(v: string) {
    if (v === value) return;
    value = v;
    onchange?.(v);
  }

  // Native radios already move focus + selection on the arrows, select on Space and make Tab land
  // on the checked chip (or the first). Missing: Home, End and Enter (a native radio would submit
  // the form instead of selecting).
  function keys(group: HTMLElement) {
    const onkeydown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        e.preventDefault();
        if (!e.target.disabled) e.target.click();
        return;
      }
      if (e.key !== 'Home' && e.key !== 'End') return;
      const radios = Array.from(
        group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'),
      );
      const target = e.key === 'Home' ? radios[0] : radios[radios.length - 1];
      if (!target) return;
      e.preventDefault();
      target.focus();
      target.click();
    };
    group.addEventListener('keydown', onkeydown);
    return () => group.removeEventListener('keydown', onkeydown);
  }
</script>

<div class="ca-chip-group {className}" data-disabled={disabled ? '' : undefined} data-invalid={error ? '' : undefined}>
  {#if label}
    <span id="{uid}-label" class="ca-chip-group__label" class:ca-sr-only={hideLabel}>
      {label}{#if required}<span class="ca-chip-group__req" aria-hidden="true"> *</span>{/if}
    </span>
  {/if}

  <div
    role="radiogroup"
    class="ca-chip-group__list"
    aria-labelledby={label ? `${uid}-label` : undefined}
    aria-label={label ? undefined : ariaLabel}
    aria-describedby={describedBy}
    aria-invalid={error ? 'true' : undefined}
    aria-required={required ? 'true' : undefined}
    aria-disabled={disabled ? 'true' : undefined}
    {@attach keys}
  >
    {#each items as item (item.value)}
      {@const checked = value === item.value}
      {@const off = disabled || !!item.disabled}
      <label
        class="ca-chip-group__chip"
        data-state={checked ? 'checked' : 'unchecked'}
        data-disabled={off ? '' : undefined}
      >
        <input
          type="radio"
          class="ca-chip-group__input"
          name={groupName}
          value={item.value}
          {checked}
          {required}
          disabled={off}
          onchange={() => select(item.value)}
        />
        {#if checked}
          <Check class="ca-chip-group__check" size={16} stroke-width={2.5} aria-hidden="true" />
        {/if}
        <span class="ca-chip-group__text">{item.label}</span>
      </label>
    {/each}
  </div>

  {#if error}
    <p id="{uid}-err" class="ca-chip-group__hint ca-chip-group__hint--error" role="alert">{error}</p>
  {:else if description}
    <p id="{uid}-hint" class="ca-chip-group__hint">{description}</p>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-chip-group {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1-5);
      min-width: 0;
      max-width: 100%;
      font-family: var(--ca-font-sans);
    }

    .ca-chip-group__label {
      font-size: var(--ca-font-size-label);
      font-weight: var(--ca-font-weight-medium);
      color: var(--ca-text-primary);
      line-height: var(--ca-line-height-snug);
      user-select: none;
    }

    .ca-chip-group__req {
      color: var(--ca-semantic-error);
    }

    /* Narrow screens: three equal columns that may shrink, so five short options are two rows and
       never push past the container. From `sm` the chips take their own width and wrap freely. */
    .ca-chip-group__list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--ca-space-2);
      min-width: 0;
    }

    @media (min-width: 600px) {
      .ca-chip-group__list {
        display: flex;
        flex-wrap: wrap;
      }
    }

    :global(.ca-chip-group__chip) {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--ca-space-1-5);
      min-width: 0;
      min-height: var(--ca-touch-target);
      padding: 0 var(--ca-space-4);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      border-radius: var(--ca-radius-chip);
      background: var(--ca-field-bg);
      color: var(--ca-text-primary);
      font-size: var(--ca-font-size-body2);
      font-weight: var(--ca-font-weight-medium);
      line-height: var(--ca-line-height-snug);
      text-align: center;
      cursor: pointer;
      user-select: none;
      transition:
        border-color var(--ca-duration-fast) var(--ca-ease-standard),
        background var(--ca-duration-fast) var(--ca-ease-standard);
    }

    :global(.ca-chip-group__chip:hover:not([data-disabled])) {
      border-color: var(--ca-outline-default);
    }

    :global(.ca-chip-group__chip[data-state='checked']) {
      border-color: var(--ca-brand-main);
      background: color-mix(in oklab, var(--ca-brand-main) 10%, var(--ca-field-bg));
      box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-brand-main);
    }

    :global(.ca-chip-group__check) {
      flex-shrink: 0;
      color: var(--ca-brand-main);
    }

    :global(.ca-chip-group__text) {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    /* Native radio stretched over the chip: invisible, but it is the focus target and hit area. */
    :global(.ca-chip-group__input) {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }

    :global(.ca-chip-group__chip:has(.ca-chip-group__input:focus-visible)) {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: var(--ca-focus-ring-offset);
    }

    :global(.ca-chip-group__chip[data-disabled]) {
      background: var(--ca-action-disabled-bg);
      border-color: var(--ca-outline-default);
      color: var(--ca-text-disabled);
      cursor: not-allowed;
    }

    :global(.ca-chip-group__chip[data-disabled][data-state='checked']) {
      box-shadow: none;
    }

    :global(.ca-chip-group[data-invalid] .ca-chip-group__chip:not([data-state='checked'])) {
      border-color: var(--ca-semantic-error);
    }

    .ca-chip-group__hint {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      line-height: var(--ca-line-height-snug);
      color: var(--ca-text-secondary);
    }

    .ca-chip-group__hint--error {
      color: var(--ca-semantic-error);
    }
}
</style>

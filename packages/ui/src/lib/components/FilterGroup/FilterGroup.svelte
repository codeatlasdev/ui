<script lang="ts">
  /**
   * FilterGroup: inline filter chips for list toolbars.
   *
   * Usage:
   *   <FilterGroup
   *     label="Role"
   *     options={[{ value: 'Admin', label: 'Admin' }, { value: 'Editor', label: 'Editor' }]}
   *     bind:value={roleFilter}
   *   />
   *
   * 'all' is included automatically. Clicking the active item deselects it (back to 'all').
   */
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label?:   string;
    options:  Option[];
    value?:   string;
    onchange?: (value: string) => void;
    class?:   string;
  }

  let {
    label,
    options,
    value = $bindable('all'),
    onchange,
    class: className = '',
  }: Props = $props();

  function select(v: string) {
    const next = value === v ? 'all' : v;
    value = next;
    onchange?.(next);
  }
</script>

<div class="ca-filter-group {className}" role="group" aria-label={label}>
  {#if label}
    <span class="ca-filter-group__label">{label}</span>
  {/if}
  {#each options as opt}
    {@const active = value === opt.value}
    <button
      type="button"
      class="ca-filter-group__item"
      class:active
      aria-pressed={active}
      onclick={() => select(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-filter-group {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-0-5);
      padding: var(--ca-space-1);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-action-hover);
      border: var(--ca-border-width) solid var(--ca-outline-subtle);
      flex-shrink: 0;
    }

    .ca-filter-group__label {
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
      padding: 0 var(--ca-space-1-5) 0 var(--ca-space-1);
      user-select: none;
    }

    .ca-filter-group__item {
      height: var(--ca-space-6);
      padding: 0 var(--ca-space-2-5);
      border-radius: var(--ca-radius-pill);
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: var(--ca-font-size-caption);
      font-weight: var(--ca-font-weight-medium);
      font-family: inherit;
      color: var(--ca-text-secondary);
      white-space: nowrap;
      transition:
        background var(--ca-duration-fast) var(--ca-ease-standard),
        color      var(--ca-duration-fast) var(--ca-ease-standard);
      line-height: 1;
    }

    .ca-filter-group__item:hover {
      color: var(--ca-text-primary);
      background: color-mix(in oklab, var(--ca-text-primary) 8%, transparent);
    }

    .ca-filter-group__item.active {
      background: var(--ca-surface-overlay);
      color: var(--ca-text-primary);
      box-shadow: var(--ca-shadow-xs);
    }

    .ca-filter-group__item:focus-visible {
      outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
      outline-offset: calc(-1 * var(--ca-border-width-focus));
    }
}
</style>

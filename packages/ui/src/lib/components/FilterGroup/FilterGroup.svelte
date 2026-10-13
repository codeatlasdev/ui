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
  .ca-filter-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: var(--ca-radius-pill);
    background: var(--ca-action-hover);
    border: 1px solid var(--ca-outline-subtle);
    flex-shrink: 0;
  }

  .ca-filter-group__label {
    font-size: var(--ca-font-size-micro);
    font-weight: 600;
    color: var(--ca-text-hint);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 6px 0 4px;
    user-select: none;
  }

  .ca-filter-group__item {
    height: 24px;
    padding: 0 10px;
    border-radius: var(--ca-radius-pill);
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--ca-font-size-caption);
    font-weight: 500;
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
    outline: 2px solid var(--ca-brand-main);
    outline-offset: -2px;
  }
</style>

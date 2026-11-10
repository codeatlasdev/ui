<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';
  import { editableRow } from '../../i18n/groups/editableRow.js';
  import { useMessages } from '../../i18n/state.svelte.js';

  interface Props {
    /** What the row is, in one line (a name, a colour dot). Always visible. */
    summary: Snippet;
    /** The fields. Beside the summary from `sm` of the row's own width; below it they open under an Edit button. */
    children: Snippet;
    /** Right-aligned actions (delete, duplicate). Always visible. */
    actions?: Snippet;
    /** Name of the row for the expand button ("Edit Lost"). Required when the fields collapse. */
    label: string;
    /** Bindable. The fields are open while the row is collapsed. Has no effect from `sm`, where they always show. */
    open?: boolean;
    class?: string;
  }

  let { summary, children, actions, label, open = $bindable(false), class: className = '' }: Props = $props();

  const t = useMessages(editableRow);
  const uid = $props.id();
</script>

<div class="ca-editable-row {className}" data-open={open ? '' : undefined}>
  <div class="ca-editable-row__summary">{@render summary()}</div>
  <button
    type="button"
    class="ca-editable-row__toggle"
    aria-label={t().editableRow.edit(label)}
    aria-expanded={open}
    aria-controls="{uid}-fields"
    onclick={() => (open = !open)}
  >
    <ChevronDown size={16} aria-hidden="true" />
  </button>
  {#if actions}
    <div class="ca-editable-row__actions">{@render actions()}</div>
  {/if}
  <div class="ca-editable-row__fields" id="{uid}-fields">{@render children()}</div>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  /* The row measures itself, not the viewport: it stacks inside a narrow column on a wide screen too. */
  .ca-editable-row {
    container-type: inline-size;
    container-name: ca-editable-row;
    min-width: 0;
  }
  .ca-editable-row__summary { min-width: 0; }
  .ca-editable-row__actions { display: flex; align-items: center; gap: var(--ca-space-1); }

  /* Narrow: summary, toggle and actions on one line, the fields under them when open. */
  .ca-editable-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: var(--ca-space-2);
  }
  .ca-editable-row__fields { grid-column: 1 / -1; display: none; }
  .ca-editable-row[data-open] .ca-editable-row__fields { display: grid; gap: var(--ca-space-3); }
  .ca-editable-row[data-open] .ca-editable-row__toggle :global(svg) { rotate: 180deg; }

  .ca-editable-row__toggle {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ca-touch-target);
    min-height: var(--ca-touch-target);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-secondary);
    cursor: pointer;
  }
  .ca-editable-row__toggle:hover { background: var(--ca-action-hover); color: var(--ca-text-primary); }
  .ca-editable-row__toggle:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: -2px; }

  /* Wide: summary, fields (auto-fit, min 10rem) and actions in one row; no toggle. */
  @container ca-editable-row (min-width: 36rem) {
    .ca-editable-row {
      grid-template-columns: minmax(8rem, 12rem) 1fr auto;
    }
    .ca-editable-row__toggle { display: none; }
    .ca-editable-row__fields,
    .ca-editable-row[data-open] .ca-editable-row__fields {
      display: grid;
      grid-column: auto;
      grid-template-columns: repeat(auto-fit, minmax(var(--ca-field-min, 10rem), 1fr));
      gap: var(--ca-space-3);
    }
    .ca-editable-row__actions { grid-column: 3; grid-row: 1; }
  }
}
</style>

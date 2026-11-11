<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Number of columns to span (the table's column count). */
    colspan: number;
    /** Renders the label as a toggle button with `aria-expanded`. Without it the row is a static section label. */
    collapsible?: boolean;
    /** Expanded state, bindable. The rows below the group row are the caller's `{#if open}`. */
    open?: boolean;
    /** Group title and count. */
    label?: Snippet;
    /** Colour of a rail at the start of the row (a stage or status colour, e.g. `var(--ca-semantic-success)`). */
    accent?: string;
    class?: string;
  }
  let { colspan, collapsible = false, open = $bindable(true), label, accent, class: className = '' }: Props = $props();
</script>

<tr class="ca-table-group {className}" data-accent={accent ? '' : undefined} style:--ca-table-group-accent={accent}>
  <th scope="rowgroup" {colspan}>
    {#if collapsible}
      <button type="button" class="ca-table-group__toggle" aria-expanded={open} onclick={() => (open = !open)}>
        <ChevronDown size={14} aria-hidden="true" class="ca-table-group__chevron" />
        {@render label?.()}
      </button>
    {:else}
      <span class="ca-table-group__toggle">{@render label?.()}</span>
    {/if}
  </th>
</tr>

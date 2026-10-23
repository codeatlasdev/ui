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
    class?: string;
  }
  let { colspan, collapsible = false, open = $bindable(true), label, class: className = '' }: Props = $props();
</script>

<tr class="ca-table-group {className}">
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

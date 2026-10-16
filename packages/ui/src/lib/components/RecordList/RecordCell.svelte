<script lang="ts">
  /**
   * RecordCell: one column value of a `RecordRow`. `label` names it: it is kept for assistive tech
   * on wide rows (the column header is `aria-hidden`) and painted above the value when the row is
   * stacked on a phone.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** The column name, repeated per cell so the value is still named once the header is gone. */
    label: string;
    class?: string;
    children?: Snippet;
  }

  let { label, class: className = '', children }: Props = $props();
</script>

<div class="ca-record-cell {className}">
  <dt>{label}</dt>
  <dd>{@render children?.()}</dd>
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-record-cell {
      min-width: 0;
      font-size: var(--ca-font-size-body2);
    }
    .ca-record-cell dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    /* Wide: the column header labels it, so the <dt> is visually hidden (utilities.css, one
       visually-hidden pattern) and stays in the a11y tree. Stacked: it is painted as a caption. */
    @container (max-width: 35.99rem) {
      .ca-record-cell dt {
        font-size: var(--ca-font-size-micro);
        font-weight: var(--ca-font-weight-semibold);
        color: var(--ca-text-hint);
        text-transform: uppercase;
        letter-spacing: var(--ca-overline-tracking);
      }
    }
}
</style>

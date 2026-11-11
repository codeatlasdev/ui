<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    class?: string;
    /** A `TextField`, `Select` or `NumberField` and `Button` / `IconButton`s, joined into one control. */
    children?: Snippet;
  }

  let { class: className = '', children, ...rest }: Props = $props();

  $effect(() => {
    if (!rest['aria-label'] && !rest['aria-labelledby'])
      devWarn('input-group-label', '<InputGroup> has no accessible name. Pass aria-label (or aria-labelledby).');
  });
</script>

<div {...rest} role="group" class="ca-input-group {className}">
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Members sit on the field box's bottom edge: a field's label sits above its box. */
    .ca-input-group {
      display: flex;
      align-items: flex-end;
      min-width: 0;
    }
    /* The field grows; buttons keep their width. */
    .ca-input-group > :global(.ca-tf),
    .ca-input-group > :global(.ca-sel),
    .ca-input-group > :global(.ca-nf) { flex: 1 1 auto; min-width: 0; }
    .ca-input-group > :global(.ca-btn),
    .ca-input-group > :global(.ca-icon-btn) { flex: 0 0 auto; position: relative; }

    /* Inner corners square, outer corners keep the control radius (the field box is the bordered part). */
    .ca-input-group > :global(:not(:last-child).ca-btn),
    .ca-input-group > :global(:not(:last-child).ca-icon-btn),
    .ca-input-group > :global(:not(:last-child)) :global(.ca-tf__wrap),
    .ca-input-group > :global(:not(:last-child)) :global(.ca-sel__trigger),
    .ca-input-group > :global(:not(:last-child)) :global(.ca-nf__wrap) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }
    .ca-input-group > :global(:not(:first-child).ca-btn),
    .ca-input-group > :global(:not(:first-child).ca-icon-btn),
    .ca-input-group > :global(:not(:first-child)) :global(.ca-tf__wrap),
    .ca-input-group > :global(:not(:first-child)) :global(.ca-sel__trigger),
    .ca-input-group > :global(:not(:first-child)) :global(.ca-nf__wrap) {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }
    /* Neighbours overlap by one border so the seam is one line. */
    .ca-input-group > :global(:not(:first-child)) { margin-inline-start: calc(var(--ca-border-width) * -1); }
    /* A button is as tall as the field box it joins. */
    .ca-input-group > :global(.ca-btn),
    .ca-input-group > :global(.ca-icon-btn) { block-size: var(--ca-control-height); }
    .ca-input-group > :global(:hover),
    .ca-input-group > :global(:focus-within) { z-index: 1; }
}
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    /** Direction the buttons are attached in. Default `'horizontal'`. */
    orientation?: 'horizontal' | 'vertical';
    class?: string;
    /** `Button`, `IconButton` or a `DropdownMenu` whose `triggerChild` is one of them. */
    children?: Snippet;
  }

  let { orientation = 'horizontal', class: className = '', children, ...rest }: Props = $props();

  // A group is only announced as a landmark-like region when it has a name.
  $effect(() => {
    if (!rest['aria-label'] && !rest['aria-labelledby'])
      devWarn('button-group-label', '<ButtonGroup> has no accessible name. Pass aria-label (or aria-labelledby).');
  });
</script>

<div {...rest} role="group" class="ca-btn-group {className}" data-orientation={orientation}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-btn-group {
      display: inline-flex;
      flex-direction: row;
      align-items: stretch;
      vertical-align: middle;
    }
    .ca-btn-group[data-orientation='vertical'] {
      flex-direction: column;
    }

    /* Members are the buttons themselves (a DropdownMenu renders only its trigger inline; its menu is
       portaled). Each keeps its own variant, size and states. */
    .ca-btn-group > :global(.ca-btn),
    .ca-btn-group > :global(.ca-icon-btn) {
      position: relative;
      border-radius: 0;
      flex: 0 0 auto;
    }

    /* Outer corners keep the control radius. */
    .ca-btn-group:not([data-orientation='vertical']) > :global(:first-child) {
      border-start-start-radius: var(--ca-radius-control);
      border-end-start-radius: var(--ca-radius-control);
    }
    .ca-btn-group:not([data-orientation='vertical']) > :global(:last-child) {
      border-start-end-radius: var(--ca-radius-control);
      border-end-end-radius: var(--ca-radius-control);
    }
    .ca-btn-group[data-orientation='vertical'] > :global(:first-child) {
      border-start-start-radius: var(--ca-radius-control);
      border-start-end-radius: var(--ca-radius-control);
    }
    .ca-btn-group[data-orientation='vertical'] > :global(:last-child) {
      border-end-start-radius: var(--ca-radius-control);
      border-end-end-radius: var(--ca-radius-control);
    }

    /* Neighbours overlap by one border so the seam is a single line, not two. */
    .ca-btn-group:not([data-orientation='vertical']) > :global(:not(:first-child)) {
      margin-inline-start: calc(var(--ca-border-width) * -1);
    }
    .ca-btn-group[data-orientation='vertical'] > :global(:not(:first-child)) {
      margin-block-start: calc(var(--ca-border-width) * -1);
    }

    /* The hovered or focused member paints over the seam, so its ring and border are never half hidden. */
    .ca-btn-group > :global(.ca-btn:hover),
    .ca-btn-group > :global(.ca-icon-btn:hover),
    .ca-btn-group > :global([aria-expanded='true']) {
      z-index: 1;
    }
    .ca-btn-group > :global(.ca-btn:focus-visible),
    .ca-btn-group > :global(.ca-icon-btn:focus-visible) {
      z-index: 2;
    }
}
</style>

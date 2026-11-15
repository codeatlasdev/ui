<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  /** Other attributes go to the `role="separator"` element; the role and orientation stay owned. */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role' | 'aria-orientation'> {
    orientation?: 'horizontal' | 'vertical';
    class?: string;
  }
  let { orientation = 'horizontal', class: className = '', ...rest }: Props = $props();
</script>

<div
  {...rest}
  role="separator"
  aria-orientation={orientation}
  class="ca-divider ca-divider--{orientation} {className}"
></div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-divider {
      flex-shrink: 0;
      background: var(--ca-outline-subtle);
    }
    .ca-divider--horizontal {
      width: 100%;
      height: var(--ca-border-width);
      margin-block: var(--ca-space-2);
    }
    .ca-divider--vertical {
      height: 100%;
      width: var(--ca-border-width);
      margin-inline: var(--ca-space-2);
    }
}
</style>

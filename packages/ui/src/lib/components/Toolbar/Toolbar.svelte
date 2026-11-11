<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { devWarn } from '../../utils/dev-warn.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    /** Names the toolbar for assistive tech. Required: a toolbar without a name is a dev warning. */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    class?: string;
    /** Fields (`TextField`, `Select`, `Combobox`, `NumberField`), buttons, `ButtonGroup`s and `ca-toolbar-spacer`. */
    children?: Snippet;
  }

  let { class: className = '', children, ...rest }: Props = $props();

  $effect(() => {
    if (!rest['aria-label'] && !rest['aria-labelledby'])
      devWarn('toolbar-label', '<Toolbar> has no accessible name. Pass aria-label (or aria-labelledby).');
  });
</script>

<div {...rest} role="toolbar" class="ca-toolbar {className}">
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* One wrapping row. Fields inside size to their content (`width: auto`) instead of filling the
       row, so a Select, a TextField and a Button sit side by side without a wrapper div per field. */
    .ca-toolbar {
      --ca-field-width: auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-toolbar-gap, var(--ca-space-2));
      min-width: 0;
    }
}
</style>

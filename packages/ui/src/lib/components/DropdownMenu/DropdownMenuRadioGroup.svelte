<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { RADIO_GROUP_CONTEXT } from './menu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    class?: string;
    /** Value of the checked radio item. Bindable. */
    value?: string;
    /** Called with the new value when the user picks an item. */
    onValueChange?: (value: string) => void;
    children?: Snippet;
  }

  let {
    class: className = '',
    value = $bindable(),
    onValueChange,
    children,
    ...rest
  }: Props = $props();

  setContext(RADIO_GROUP_CONTEXT, {
    get value() {
      return value;
    },
    select(next: string) {
      if (next === value) return;
      value = next;
      onValueChange?.(next);
    },
  });
</script>

<div {...rest} role="group" class="ca-dropdown-group {className}">
  {@render children?.()}
</div>

<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { scrollFocusable } from '../../actions/scroll-focusable.js';
  import { SPLITTER_KEY, type SplitterContext } from './splitter.js';

  /** One panel of a `ResizablePanels` group. Sizes are percentages of the group. */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'id'> {
    /** Stable id: the key of the persisted layout. Unique inside the group. */
    id: string;
    /** Starting size in percent. Unset panels share what the others leave. */
    defaultSize?: number;
    /** Smallest size in percent. @default 10 */
    minSize?: number;
    /** Largest size in percent. @default 100 */
    maxSize?: number;
    class?: string;
    children?: Snippet;
  }

  let {
    id,
    defaultSize,
    minSize = 10,
    maxSize = 100,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const ctx = getContext<SplitterContext>(SPLITTER_KEY);
  const domId = $props.id();
  const size = $derived(ctx.size(id));

  onMount(() => ctx.register({ id, min: minSize, max: maxSize }, defaultSize ?? NaN));
</script>

<div
  {...rest}
  id={`${domId}-${id}`}
  data-panel-id={id}
  class="ca-resizable__panel {className}"
  style:--ca-panel-size={size}
  use:scrollFocusable
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-resizable__panel {
      flex: var(--ca-panel-size, 1) 1 0;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
}
</style>

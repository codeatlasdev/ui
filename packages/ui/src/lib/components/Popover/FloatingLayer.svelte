<script lang="ts" module>
  import type { Align, Side } from '../../primitives/index.js';

  export interface FloatingLayerProps {
    /** Element the layer is positioned against. */
    anchor: HTMLElement | null | undefined;
    open: boolean;
    /** Called when Escape / an outside press asks to close. */
    onDismiss?: (reason: 'escape' | 'outside' | 'focus-outside') => void;
    side?: Side;
    align?: Align;
    sideOffset?: number;
    sameWidth?: boolean;
    /** Close on focus leaving the layer. Default false (menus and popovers keep focus explicit). */
    focusOutside?: boolean;
    /** Extra elements treated as inside (the trigger is always excluded). */
    exclude?: () => Element[];
    /** Classes on the layer element (carries `data-state`, `data-side`, `data-align`). */
    class?: string;
    role?: string;
    id?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-orientation'?: 'vertical' | 'horizontal';
    tabindex?: number;
    /** Receives the layer element (to focus it, query items, etc.). */
    ref?: HTMLElement | null;
    onkeydown?: (e: KeyboardEvent) => void;
    onpointerenter?: (e: PointerEvent) => void;
    onpointerleave?: (e: PointerEvent) => void;
    children?: import('svelte').Snippet;
    /** Runs once the layer is mounted and positioned (focus management). May return a cleanup, run when the layer closes or unmounts (cancel deferred focus moves here). */
    onMounted?: (el: HTMLElement) => void | (() => void);
    /** Set false for hints (tooltips): they never take Escape or outside presses, the trigger closes them. */
    dismiss?: boolean;
    /** Keep focus where it is on close (the caller moves it). Default: focus goes back to the anchor. */
    restoreFocus?: boolean;
  }
</script>

<script lang="ts">
  import { createPresence, openLayer } from '../../primitives/index.js';
  import './floating-layer.css';

  let {
    anchor,
    open,
    onDismiss,
    side = 'bottom',
    align = 'start',
    sideOffset = 0,
    sameWidth = false,
    focusOutside = false,
    exclude,
    class: className = '',
    ref = $bindable(null),
    onMounted,
    dismiss = true,
    restoreFocus,
    children,
    ...rest
  }: FloatingLayerProps = $props();

  const presence = createPresence(() => open);

  // The layer lives while it is `present` (through the exit animation); `open` only flips `data-state`.
  // Restoring focus is the owner's call (Escape returns it, an outside press leaves it where it went),
  // so the engine never moves it on its own here.
  $effect(() => {
    const el = ref;
    if (!el || !presence.present || !anchor) return;
    const layer = openLayer(el, {
      kind: dismiss ? 'popover' : 'hint',
      anchor,
      side,
      align,
      sideOffset,
      sameWidth,
      focusOutside,
      exclude,
      restoreFocus: restoreFocus ?? false,
      onDismiss: (reason) => onDismiss?.(reason),
    });
    return () => layer.close();
  });

  // The returned cleanup runs when the layer closes or unmounts, so work deferred from `onMounted`
  // (a frame-delayed focus move) can never outlive the open state and steal focus back from the trigger.
  $effect(() => {
    const el = ref;
    if (el && open) return onMounted?.(el);
  });
</script>

{#if presence.present}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={ref}
    {@attach presence.ref}
    class="ca-floating {className}"
    data-state={open ? 'open' : 'closed'}
    data-side={side}
    data-align={align}
    id={rest.id}
    role={rest.role}
    aria-label={rest['aria-label']}
    aria-labelledby={rest['aria-labelledby']}
    aria-orientation={rest['aria-orientation']}
    tabindex={rest.tabindex}
    onkeydown={rest.onkeydown}
    onpointerenter={rest.onpointerenter}
    onpointerleave={rest.onpointerleave}
  >
    {@render children?.()}
  </div>
{/if}

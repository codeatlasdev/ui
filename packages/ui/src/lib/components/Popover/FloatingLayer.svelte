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
    /** Classes on the animated element (carries `data-state`, `data-side`, `data-align`). */
    class?: string;
    role?: string;
    id?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-orientation'?: 'vertical' | 'horizontal';
    tabindex?: number;
    /** Receives the animated element (to focus it, query items, etc.). */
    ref?: HTMLElement | null;
    onkeydown?: (e: KeyboardEvent) => void;
    onpointerenter?: (e: PointerEvent) => void;
    onpointerleave?: (e: PointerEvent) => void;
    children?: import('svelte').Snippet;
    /** Runs once the layer is mounted and positioned (focus management). */
    onMounted?: (el: HTMLElement) => void;
    /** Set false for layers that never dismiss themselves (tooltips are closed by their trigger). */
    dismiss?: boolean;
    /** z-index CSS value for the floated wrapper. Default `var(--ca-z-dropdown)`. */
    z?: string;
  }
</script>

<script lang="ts">
  import { createPresence, dismissable, float, portal } from '../../primitives/index.js';

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
    z = 'var(--ca-z-dropdown)',
    children,
    ...rest
  }: FloatingLayerProps = $props();

  const presence = createPresence(() => open);
  let wrapper = $state<HTMLElement | null>(null);

  // Wrapper is floated (transform: translate); the inner element animates, so they never fight.
  $effect(() => {
    if (!anchor || !wrapper || !presence.present) return;
    return float(anchor, wrapper, { side, align, sideOffset, sameWidth });
  });

  // Mirror the resolved placement onto the animated element for CSS (`[data-side]`).
  $effect(() => {
    const w = wrapper;
    const el = ref;
    if (!w || !el) return;
    const sync = () => {
      el.dataset.side = w.dataset.side ?? side;
      el.dataset.align = w.dataset.align ?? align;
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(w, { attributes: true, attributeFilter: ['data-side', 'data-align'] });
    return () => mo.disconnect();
  });

  $effect(() => {
    const el = ref;
    if (el && open) onMounted?.(el);
  });

  function layer(node: HTMLElement) {
    if (!dismiss) return;
    return dismissable(node, {
      onDismiss: (reason) => {
        if (reason === 'focus-outside' && !focusOutside) return;
        onDismiss?.(reason);
      },
      exclude: () => [...(anchor ? [anchor] : []), ...(exclude?.() ?? [])],
    });
  }
</script>

{#if presence.present}
  <div
    bind:this={wrapper}
    {@attach portal()}
    class="ca-floating"
    style:z-index={z}
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={ref}
      {@attach presence.ref}
      {@attach layer}
      class={className}
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
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-floating) {
      position: absolute;
      top: 0;
      left: 0;
      width: max-content;
    }
}
</style>

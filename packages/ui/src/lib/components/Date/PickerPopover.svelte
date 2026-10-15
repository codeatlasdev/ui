<script lang="ts">
  /**
   * Internal: the floating dialog shared by DatePicker and DateRangePicker. A layer-engine popover
   * (top layer, anchored to the field), closes on Escape / outside press and stays mounted through
   * the exit animation. Not exported from the package.
   */
  import type { Snippet } from 'svelte';
  import { createPresence, openLayer } from '../../primitives/index.js';
  import '../Popover/floating-layer.css';

  interface Props {
    open: boolean;
    /** The element the popover is positioned against (the field wrapper's trigger). */
    anchor: HTMLElement | null;
    /** Pressing it is not an "outside" press; focus returns to it on close. */
    trigger: HTMLElement | null;
    id: string;
    label: string;
    onclose: () => void;
    /** Receives the content node on open, to move focus to the active day. */
    onopen?: (content: HTMLElement) => void;
    children: Snippet;
  }

  let { open, anchor, trigger, id, label, onclose, onopen, children }: Props = $props();

  const presence = createPresence(() => open);

  function layer(node: HTMLElement) {
    if (!anchor) return;
    const handle = openLayer(node, {
      kind: 'popover',
      anchor,
      side: 'bottom',
      align: 'start',
      sideOffset: 6,
      exclude: () => (trigger ? [trigger] : []),
      // pressing Escape returns focus to the trigger; an outside press leaves it where it went
      restoreFocus: false,
      onDismiss: (reason) => {
        onclose();
        if (reason === 'escape') trigger?.focus();
      },
    });
    onopen?.(node);
    return () => handle.close();
  }
</script>

{#if presence.present}
  <div
    {id}
    class="ca-floating ca-date__content glass-overlay"
    role="dialog"
    aria-label={label}
    tabindex="-1"
    data-state={open ? 'open' : 'closed'}
    {@attach presence.ref}
    {@attach layer}
  >
    {@render children()}
  </div>
{/if}

<script lang="ts">
  /**
   * Internal: the floating dialog shared by DatePicker and DateRangePicker. Portals to body,
   * positions with `float` (a wrapper is floated so the inner element can animate `transform`),
   * closes on Escape / outside press and keeps mounted through the exit animation.
   * Not exported from the package.
   */
  import type { Snippet } from 'svelte';
  import { createPresence, dismissable, float, portal } from '../../primitives/index.js';

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

  function mount(wrapper: HTMLElement) {
    if (!anchor) return;
    return float(anchor, wrapper, { side: 'bottom', align: 'start', sideOffset: 6 });
  }

  function dismiss(node: HTMLElement) {
    return dismissable(node, {
      exclude: () => (trigger ? [trigger] : []),
      onDismiss: (reason) => {
        onclose();
        // pressing Escape returns focus to the trigger; an outside press leaves it where it went
        if (reason === 'escape') trigger?.focus();
      },
    });
  }

  function opened(node: HTMLElement) {
    onopen?.(node);
  }
</script>

{#if presence.present}
  <div
    class="ca-date__float"
    style="z-index: var(--ca-z-dropdown)"
    {@attach portal()}
    {@attach mount}
  >
    <div
      {id}
      class="ca-date__content glass-overlay"
      role="dialog"
      aria-label={label}
      tabindex="-1"
      data-state={open ? 'open' : 'closed'}
      {@attach presence.ref}
      {@attach dismiss}
      {@attach opened}
    >
      {@render children()}
    </div>
  </div>
{/if}

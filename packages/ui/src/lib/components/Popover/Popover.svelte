<script lang="ts">
  import type { Snippet } from 'svelte';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from './FloatingLayer.svelte';
  import { createTriggerProps, tabIntoPopup } from './trigger.js';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the popover's own button. */
    trigger?: Snippet;
    /** Interactive trigger (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
    children?: Snippet;
    side?:       'top' | 'right' | 'bottom' | 'left';
    align?:      'start' | 'center' | 'end';
    sideOffset?: number;
  }

  let {
    class: className = '',
    trigger,
    triggerChild,
    children,
    side       = 'bottom',
    align      = 'center',
    sideOffset = 8,
  }: Props = $props();

  const id = uid('pop');
  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let content = $state<HTMLElement | null>(null);

  const makeTrigger = createTriggerProps((el) => (anchor = el));
  const triggerAttrs = $derived(
    makeTrigger({ id: `${id}-trigger`, popup: 'dialog', open, controls: `${id}-content`, onToggle: () => (open = !open), onKeydown: (e) => open && tabIntoPopup(e, content) })
  );

  function close(restoreFocus: boolean) {
    open = false;
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }

</script>

{#if triggerChild}
  {@render triggerChild(triggerAttrs)}
{:else if trigger}
  <button type="button" class="ca-popover__trigger" {...triggerAttrs}>
    {@render trigger()}
  </button>
{/if}

<FloatingLayer
  {anchor}
  {open}
  {side}
  {align}
  {sideOffset}
  bind:ref={content}
  id="{id}-content"
  role="dialog"
  tabindex={-1}
  aria-labelledby="{id}-trigger"
  class="ca-popover-content glass-overlay {className}"
  onDismiss={(reason) => close(reason === 'escape')}
>
  {@render children?.()}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-popover__trigger) {
      display: inline-flex;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
    }

    :global(.ca-popover-content) {
      border-radius: var(--ca-radius-lg);
      padding: var(--ca-space-4);
      max-width: 320px;
      outline: none;
      animation: ca-popover-in var(--ca-duration-fast) var(--ca-ease-decelerate);
    }

    :global(.ca-popover-content[data-state='closed']) {
      animation: ca-popover-out var(--ca-duration-fast) var(--ca-ease-standard);
    }

    @keyframes ca-popover-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes ca-popover-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.96); }
    }
}
</style>

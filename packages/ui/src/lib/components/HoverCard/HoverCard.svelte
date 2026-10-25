<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { createHoverIntent, modalBlocks } from '../../primitives/index.js';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';
  import { tabIntoPopup } from '../Popover/trigger.js';

  interface Props {
    class?: string;
    /** Non-interactive trigger content (text, icon). Wrapped in the card's own button. */
    trigger?: Snippet;
    /** Interactive trigger (a link, Button or Avatar button): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
    children?: Snippet;
    /** Bindable. Whether the card is open. */
    open?: boolean;
    /** Called when the user opens or closes the card (not when the bound value is set from code). */
    onOpenChange?: (open: boolean) => void;
    /** Milliseconds the pointer must rest on the trigger before the card opens. Keyboard focus opens it at once. */
    openDelay?: number;
    /** Milliseconds the card stays open after the pointer or focus leaves, so the pointer can cross into it. */
    closeDelay?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
  }

  let {
    class: className = '',
    trigger,
    triggerChild,
    children,
    open = $bindable(false),
    onOpenChange,
    openDelay = 700,
    closeDelay = 300,
    side = 'bottom',
    align = 'center',
    sideOffset = 8,
  }: Props = $props();

  const id = uid('hovercard');
  let anchor = $state<HTMLElement | null>(null);
  let card = $state<HTMLElement | null>(null);

  function setOpen(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

  // `createHoverIntent` takes fixed delays: rebuild it when a delay prop changes.
  const intent = $derived.by(() => createHoverIntent({ openDelay, closeDelay, onOpenChange: setOpen }));
  $effect(() => {
    const current = intent;
    return () => current.destroy();
  });

  /** Focus is inside the trigger or the card: the card must not close on a pointer leaving. */
  const hasFocus = () => !!anchor?.matches(':focus-within') || !!card?.matches(':focus-within');

  /** Focus handed back to the trigger by the card itself (Escape): it must not reopen the card. */
  let returning = false;
  const key = createAttachmentKey();
  const attach = (node: HTMLElement) => {
    anchor = node;
    // Open on real pointer movement, not on pointerenter: content that mounts or moves under a resting
    // cursor fires enter without the user doing anything. Touch has no hover: it never opens the card.
    let armed = true;
    let pointerFocus = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !armed || modalBlocks(node)) return;
      armed = false;
      intent.enter();
    };
    const onLeave = (e: PointerEvent) => {
      armed = true;
      if (e.pointerType !== 'touch') intent.leave();
    };
    // A press focuses the trigger: that focus is not a keyboard intent to preview.
    const onPointerDown = () => {
      pointerFocus = true;
    };
    const onFocus = () => {
      if (pointerFocus || returning) return;
      intent.set(true);
    };
    const onBlur = (e: FocusEvent) => {
      pointerFocus = false;
      // Focus moving into the card keeps it open; the card's own focusout handles leaving it.
      if (e.relatedTarget instanceof Node && card?.contains(e.relatedTarget)) return;
      intent.leave();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        intent.set(false);
      } else if (open) tabIntoPopup(e, card);
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('focus', onFocus);
    node.addEventListener('blur', onBlur);
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('keydown', onKey);
      anchor = null;
    };
  };

  const triggerAttrs = $derived({
    'aria-describedby': open ? `${id}-content` : undefined,
    'data-state': open ? 'open' : 'closed',
    [key]: attach,
  });

  function onCardKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    intent.set(false);
    returning = true;
    anchor?.focus({ preventScroll: true });
    returning = false;
  }

  function onCardFocusout(e: FocusEvent) {
    const to = e.relatedTarget;
    if (to instanceof Node && (card?.contains(to) || anchor?.contains(to))) return;
    intent.leave();
  }
</script>

{#if triggerChild}
  {@render triggerChild(triggerAttrs)}
{:else if trigger}
  <button type="button" class="ca-hovercard__trigger" {...triggerAttrs}>
    {@render trigger()}
  </button>
{/if}

<!-- A preview, not a dialog or a menu: it never takes Escape or presses from the layer below (`dismiss`
     off), keeps focus where it is, and is reached from the keyboard with Tab from the trigger. -->
<FloatingLayer
  {anchor}
  {open}
  {side}
  {align}
  {sideOffset}
  dismiss={false}
  bind:ref={card}
  id="{id}-content"
  role="group"
  class="ca-hovercard-content glass-overlay {className}"
  onpointerenter={() => intent.enter()}
  onpointerleave={() => {
    if (!hasFocus()) intent.leave();
  }}
  onkeydown={onCardKeydown}
  onfocusout={onCardFocusout}
>
  {@render children?.()}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-hovercard__trigger) {
      display: inline-flex;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
    }

    :global(.ca-hovercard-content) {
      border-radius: var(--ca-radius-lg);
      padding: var(--ca-space-4);
      inline-size: max-content;
      max-inline-size: min(20rem, calc(100vw - var(--ca-space-8)));
      outline: none;
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-primary);
      animation: ca-hovercard-in var(--ca-enter-fast) var(--ca-ease-decelerate);
    }

    :global(.ca-hovercard-content[data-state='closed']) {
      animation: ca-hovercard-out var(--ca-enter-fast) var(--ca-ease-standard);
    }

    @keyframes ca-hovercard-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes ca-hovercard-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.96); }
    }
}
</style>

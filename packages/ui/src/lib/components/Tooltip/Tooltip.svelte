<script lang="ts" module>
  // Moving between tooltips within this window skips the open delay (as a toolbar sweep should).
  const SKIP_WINDOW_MS = 300;
  let lastClosedAt = 0;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { uid } from '../../utils/index.js';
  import FloatingLayer from '../Popover/FloatingLayer.svelte';

  interface Props {
    content: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    class?: string;
    /** Non-interactive content (text, icon). Wrapped in the tooltip's own button. */
    children?: Snippet;
    /** Interactive target (a Button/IconButton): receives the trigger `props` to spread onto it. */
    triggerChild?: Snippet<[Record<string, unknown>]>;
  }

  let { content, side = 'top', delay = 500, class: className = '', children, triggerChild }: Props = $props();

  const id = uid('tip');
  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);

  function setOpen(next: boolean) {
    if (open && !next) lastClosedAt = performance.now();
    open = next;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => clearTimeout(timer);
  const openIntent = () => {
    cancel();
    // Sweeping between tooltips skips the delay.
    const wait = performance.now() - lastClosedAt < SKIP_WINDOW_MS ? 0 : delay;
    if (wait <= 0) setOpen(true);
    else timer = setTimeout(() => setOpen(true), wait);
  };
  const closeIntent = () => {
    cancel();
    setOpen(false);
  };

  // Focus opens immediately (keyboard users get no hover delay); pointer respects the delay.
  let pointerFocus = false;
  const key = createAttachmentKey();
  const attach = (node: HTMLElement) => {
    anchor = node;
    // Open on real pointer movement, not on pointerenter: content that mounts or moves under a resting
    // cursor fires enter without the user doing anything. Touch never opens a hover tooltip.
    let armed = true;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !armed) return;
      armed = false;
      openIntent();
    };
    const onLeave = () => {
      armed = true;
      closeIntent();
    };
    const onPointerDown = () => {
      pointerFocus = true;
      closeIntent();
    };
    const onFocus = () => {
      if (pointerFocus) return;
      cancel();
      setOpen(true);
    };
    const onBlur = () => {
      pointerFocus = false;
      closeIntent();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        closeIntent();
      }
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('focus', onFocus);
    node.addEventListener('blur', onBlur);
    node.addEventListener('keydown', onKey);
    return () => {
      cancel();
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
    'aria-describedby': open ? id : undefined,
    'data-state': open ? 'open' : 'closed',
    [key]: attach,
  });
</script>

{#if triggerChild}
  {@render triggerChild(triggerAttrs)}
{:else}
  <button type="button" class="ca-tooltip__trigger" {...triggerAttrs}>
    {@render children?.()}
  </button>
{/if}

<FloatingLayer
  {anchor}
  {open}
  {side}
  align="center"
  sideOffset={6}
  dismiss={false}
  {id}
  role="tooltip"
  class="ca-tooltip-content {className}"
  blur="tooltip"
  onpointerenter={() => cancel()}
  onpointerleave={closeIntent}
>
  {content}
</FloatingLayer>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-tooltip__trigger) {
      display: inline-flex;
      background: transparent;
      border: none;
      padding: 0;
      cursor: inherit;
    }

    :global(.ca-tooltip-content) {
      /* Inverse, near-opaque surface: --ca-tooltip-fg needs it to reach AA in both schemes. */
      background: var(--ca-tooltip-bg);
      border: var(--ca-border-width) solid var(--ca-glass-border);
      border-radius: var(--ca-radius-sm);
      padding: var(--ca-space-1-5) var(--ca-space-2-5);
      font-size: var(--ca-font-size-caption);
      color: var(--ca-tooltip-fg);
      max-width: 240px;
      box-shadow: var(--ca-shadow-md);
      animation: ca-tooltip-in var(--ca-duration-fast) var(--ca-ease-decelerate);
      line-height: var(--ca-line-height-body);
    }

    :global(.ca-tooltip-content[data-state='closed']) {
      animation: ca-tooltip-out var(--ca-duration-fast) var(--ca-ease-standard);
    }

    @keyframes ca-tooltip-in {
      from { opacity: 0; transform: scale(0.94); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes ca-tooltip-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.94); }
    }
}
</style>

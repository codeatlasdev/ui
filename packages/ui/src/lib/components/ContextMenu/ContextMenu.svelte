<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'oncontextmenu' | 'onkeydown'> {
    class?: string;
    /** The region the menu belongs to. Right-click, long-press and Shift+F10 inside it open the menu. */
    children?: Snippet;
    /** The menu: `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuSub`, labels and separators. */
    menu: Snippet;
    /** Bindable. Whether the menu is open. */
    open?: boolean;
    /** Called when the user opens or closes the menu (not when the bound value is set from code). */
    onOpenChange?: (open: boolean) => void;
    /** Keep the browser's own menu and open nothing. */
    disabled?: boolean;
    /** Milliseconds a touch must stay down before the menu opens. */
    longPressDelay?: number;
    /** Make the region reachable with Tab so Shift+F10 and the ContextMenu key work. Turn off when the region holds its own focusable target. */
    focusable?: boolean;
    /** Class on the menu surface. */
    menuClass?: string;
  }

  let {
    class: className = '',
    children,
    menu,
    open = $bindable(false),
    onOpenChange,
    disabled = false,
    longPressDelay = 500,
    focusable = true,
    menuClass = '',
    ...rest
  }: Props = $props();

  let point = $state<{ x: number; y: number } | null>(null);
  let region = $state<HTMLElement | null>(null);

  /** Text fields keep the browser's menu (copy, paste, spellcheck): a custom one would take it away. */
  const native = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

  function show(x: number, y: number) {
    point = { x, y };
    if (!open) {
      open = true;
      onOpenChange?.(true);
    }
  }

  function setOpen(next: boolean) {
    if (next === open) return;
    open = next;
    onOpenChange?.(next);
  }

  function oncontextmenu(e: MouseEvent) {
    if (disabled || native(e.target)) return;
    e.preventDefault();
    show(e.clientX, e.clientY);
  }

  function onkeydown(e: KeyboardEvent) {
    if (disabled || (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10'))) return;
    if (native(e.target)) return;
    e.preventDefault();
    const el = e.target instanceof HTMLElement ? e.target : region;
    const r = (el ?? region)?.getBoundingClientRect();
    if (r) show(r.left + 8, r.bottom);
  }

  // Touch has no right button: a press that stays put for `longPressDelay` opens the menu at the finger.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let start: { x: number; y: number } | null = null;
  const MOVE_SLOP = 10;
  const cancel = () => {
    clearTimeout(timer);
    start = null;
  };
  function onpointerdown(e: PointerEvent) {
    if (disabled || e.pointerType !== 'touch' || native(e.target)) return;
    cancel();
    start = { x: e.clientX, y: e.clientY };
    const { clientX: x, clientY: y } = e;
    timer = setTimeout(() => {
      start = null;
      show(x, y);
    }, longPressDelay);
  }
  function onpointermove(e: PointerEvent) {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_SLOP) cancel();
  }
  $effect(() => () => clearTimeout(timer));
</script>

<!-- A region with a context menu: right-click, long press and Shift+F10 / the ContextMenu key. The role is the
     author's (`role`, `aria-label` in the rest props); the menu itself is a real `role="menu"`. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  {...rest}
  bind:this={region}
  class="ca-contextmenu {className}"
  tabindex={focusable ? (rest.tabindex ?? 0) : rest.tabindex}
  data-state={open ? 'open' : 'closed'}
  {oncontextmenu}
  {onkeydown}
  {onpointerdown}
  {onpointermove}
  onpointerup={cancel}
  onpointercancel={cancel}
>
  {@render children?.()}
</div>

<DropdownMenu {open} onOpenChange={setOpen} anchor={point} class={menuClass}>
  {@render menu()}
</DropdownMenu>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* Touch: the browser's callout/selection on a long press would fight the menu. */
    :global(.ca-contextmenu) {
      -webkit-touch-callout: none;
    }
}
</style>

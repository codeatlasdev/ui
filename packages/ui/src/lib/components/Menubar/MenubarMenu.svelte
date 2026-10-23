<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { uid } from '../../utils/index.js';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import { MENUBAR_CONTEXT, type MenubarContext } from './menubar-context.js';

  interface Props {
    class?: string;
    /** Text of the bar item. */
    label: string;
    /** `DropdownMenuItem`, checkbox and radio items, `DropdownMenuSub`, labels and separators. */
    children?: Snippet;
    disabled?: boolean;
    /** Class on the menu surface. */
    menuClass?: string;
  }

  let { class: className = '', label, children, disabled = false, menuClass = '' }: Props = $props();

  const bar = getContext<MenubarContext | undefined>(MENUBAR_CONTEXT);
  if (!bar) throw new Error('MenubarMenu must be used inside a Menubar');

  const id = uid('menubar-menu');
  const open = $derived(bar.openId === id);
  /** Keyboard opens (ArrowUp) land on the last item; everything else on the first. */
  let focusLast = $state(false);

  // `DropdownMenu` reports user-driven changes; the bar owns which menu is open.
  function onOpenChange(next: boolean) {
    bar?.setOpen(next ? id : null);
  }

  function ontriggerkeydown(e: KeyboardEvent) {
    if (disabled) return;
    focusLast = e.key === 'ArrowUp';
  }

  function onmenukeydown(e: KeyboardEvent) {
    // ArrowLeft/Right at the top level of a menu go to the neighbouring menu; inside a submenu they belong to it.
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      bar?.move(id, 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      bar?.move(id, -1, true);
    }
  }

  // Pointer: while a menu is open, resting on another item switches to it; hover alone never opens.
  function onpointerenter() {
    if (!disabled && bar?.openId && bar.openId !== id) bar.setOpen(id);
  }
</script>

<DropdownMenu
  open={open && !disabled}
  {onOpenChange}
  {onmenukeydown}
  {ontriggerkeydown}
  openFocus={focusLast ? 'last' : 'first'}
  class={menuClass}
  align="start"
  sideOffset={4}
>
  {#snippet triggerChild(props)}
    <button
      {...props}
      type="button"
      role="menuitem"
      class="ca-menubar__item {className}"
      data-ca-menubar-item={id}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled ? 'true' : undefined}
      onclick={(e) => {
        if (disabled) return;
        (props.onclick as (e: MouseEvent) => void)(e);
      }}
      {onpointerenter}
    >
      {label}
    </button>
  {/snippet}
  {@render children?.()}
</DropdownMenu>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-menubar__item) {
      display: inline-flex;
      align-items: center;
      block-size: calc(var(--ca-control-height) - var(--ca-space-2));
      padding: 0 var(--ca-space-3);
      border: none;
      border-radius: var(--ca-radius-sm);
      background: transparent;
      color: var(--ca-text-primary);
      font: inherit;
      font-size: var(--ca-font-size-body2);
      font-weight: 500;
      cursor: pointer;
    }
    :global(.ca-menubar__item:hover),
    :global(.ca-menubar__item[data-state='open']) {
      background: var(--ca-action-hover);
    }
    :global(.ca-menubar__item[data-disabled]) {
      color: var(--ca-text-disabled);
      cursor: default;
      pointer-events: none;
    }
}
</style>

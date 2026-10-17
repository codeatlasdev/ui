<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { ChevronRight } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { SUB_MENU_CONTEXT, type SubMenuContext } from './menu-context.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onclick' | 'role' | 'tabindex'> {
    class?: string;
    /** Leading icon in a fixed box (`aria-hidden`, so the label stays the accessible name). */
    icon?: Snippet;
    children?: Snippet;
  }

  let { class: className = '', icon, children, ...rest }: Props = $props();

  const sub = getContext<SubMenuContext>(SUB_MENU_CONTEXT);
  if (!sub) throw new Error('DropdownMenuSubTrigger must be used in the `trigger` snippet of a DropdownMenuSub');

  let highlighted = $state(false);
  const anchorKey = createAttachmentKey();
  const attachAnchor = (node: HTMLElement) => {
    sub.setAnchor(node);
    return () => sub.setAnchor(null);
  };

  function onkeydown(e: KeyboardEvent) {
    if (sub.disabled) return;
    // ArrowRight, Enter and Space open it from the keyboard with focus on the first item. The parent
    // menu would turn Enter/Space into a click (a pointer open, focus stays here), so it never sees them.
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      sub.show('first');
    }
  }
</script>

<!-- Enter/Space reach the menu's keydown (roving focus), which clicks the focused item. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  {...rest}
  {...{ [anchorKey]: attachAnchor }}
  id={sub.triggerId}
  role="menuitem"
  tabindex="-1"
  class="ca-dropdown-item ca-dropdown-item--default ca-dropdown-item--sub-trigger {className}"
  aria-haspopup="menu"
  aria-expanded={sub.open}
  aria-controls={sub.open ? sub.contentId : undefined}
  aria-disabled={sub.disabled ? 'true' : undefined}
  data-state={sub.open ? 'open' : 'closed'}
  data-disabled={sub.disabled ? '' : undefined}
  data-highlighted={highlighted ? '' : undefined}
  onclick={() => sub.show('none')}
  {onkeydown}
  onfocus={() => (highlighted = true)}
  onblur={() => (highlighted = false)}
  onpointerenter={() => sub.hoverEnter()}
  onpointerleave={() => sub.hoverLeave()}
  onpointermove={(e) => {
    if (!sub.disabled && e.currentTarget !== document.activeElement) e.currentTarget.focus({ preventScroll: true });
  }}
>
  {#if icon}
    <span class="ca-dropdown-item__icon" aria-hidden="true">{@render icon()}</span>
  {/if}
  <span class="ca-dropdown-item__label">{@render children?.()}</span>
  <ChevronRight class="ca-dropdown-item__chevron" size={14} aria-hidden="true" />
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-dropdown-item__label) {
      flex: 1;
      min-inline-size: 0;
    }
    :global(.ca-dropdown-item__chevron) {
      flex: none;
      color: var(--ca-text-secondary);
    }
    :global(.ca-dropdown-item--sub-trigger[data-state='open']:not([data-highlighted])) {
      background: var(--ca-action-hover);
    }
    :global(html[dir='rtl'] .ca-dropdown-item__chevron) {
      transform: scaleX(-1);
    }
}
</style>

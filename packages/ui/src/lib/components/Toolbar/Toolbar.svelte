<script lang="ts">
  import { Ellipsis } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { toolbar } from '../../i18n/groups/toolbar.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { devWarn } from '../../utils/dev-warn.js';
  import { measureOverflow, observeOverflow } from '../../utils/overflow.js';
  import IconButton from '../Button/IconButton.svelte';
  import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
  import DropdownMenuItem from '../DropdownMenu/DropdownMenuItem.svelte';
  const t = useMessages(toolbar);

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    /** Names the toolbar for assistive tech. Required: a toolbar without a name is a dev warning. */
    'aria-label'?: string;
    'aria-labelledby'?: string;
    class?: string;
    /**
     * What happens when the items do not fit. `'wrap'` (default) breaks onto more lines. `'scroll'`
     * keeps one line and scrolls sideways, with no visible scrollbar. `'menu'` keeps one line and moves
     * the items that do not fit into a "More" menu at the end; an item with `data-priority="primary"`
     * never moves, and `data-overflow="Label"` names its menu entry (default: its `aria-label`, then its text).
     */
    overflow?: 'wrap' | 'scroll' | 'menu';
    /** Accessible name of the "More" button of `overflow="menu"`. Default: the localized "More". */
    moreLabel?: string;
    /** Fields (`TextField`, `Select`, `Combobox`, `NumberField`), buttons, `ButtonGroup`s and `ca-toolbar-spacer`. */
    children?: Snippet;
  }

  let { class: className = '', overflow = 'wrap', moreLabel, children, ...rest }: Props = $props();

  $effect(() => {
    if (!rest['aria-label'] && !rest['aria-labelledby'])
      devWarn('toolbar-label', '<Toolbar> has no accessible name. Pass aria-label (or aria-labelledby).');
  });

  interface Moved {
    el: HTMLElement;
    label: string;
    disabled: boolean;
  }

  let root = $state<HTMLElement | null>(null);
  let moved = $state.raw<Moved[]>([]);

  const labelOf = (el: HTMLElement) =>
    el.dataset.overflow || el.getAttribute('aria-label') || el.textContent?.trim() || '';
  /** The row's own children, never the More wrapper. A spacer stays in the list: it takes a gap slot. */
  const movable = (bar: HTMLElement) =>
    Array.from(bar.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.classList.contains('ca-toolbar__more')
    );

  /** Un-hides everything, measures, then hides what does not fit: one synchronous pass, so no flash. */
  function layout(bar: HTMLElement) {
    const items = movable(bar);
    for (const el of items) el.removeAttribute('data-overflowed');
    const trigger = bar.querySelector<HTMLElement>(':scope > .ca-toolbar__more');
    trigger?.removeAttribute('data-shown');
    // Reserve the trigger's real width: show it for the measurement, it is hidden again below.
    trigger?.setAttribute('data-measuring', '');
    const reserve = trigger?.getBoundingClientRect().width || 32;
    trigger?.removeAttribute('data-measuring');
    const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
    const out = measureOverflow({
      items,
      container: bar,
      reserve,
      gap,
      pinned: (el) =>
        el.classList.contains('ca-toolbar-spacer') ||
        el.dataset.priority === 'primary' ||
        el.querySelector('[data-priority="primary"]') !== null,
    });
    items.forEach((el, i) => {
      if (out.has(i)) el.setAttribute('data-overflowed', '');
    });
    if (out.size) trigger?.setAttribute('data-shown', '');
    const next = items
      .filter((_, i) => out.has(i))
      .map((el) => ({ el, label: labelOf(el), disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' }));
    const same = next.length === moved.length && next.every((m, i) => m.el === moved[i].el && m.label === moved[i].label && m.disabled === moved[i].disabled);
    if (!same) moved = next;
  }

  $effect(() => {
    if (overflow !== 'menu' || !root) {
      moved = [];
      return;
    }
    const bar = root;
    layout(bar);
    return observeOverflow(
      bar,
      () => movable(bar),
      () => layout(bar)
    );
  });
</script>

<div bind:this={root} {...rest} role="toolbar" class="ca-toolbar {className}" data-overflow={overflow}>
  {@render children?.()}
  {#if overflow === 'menu'}
    <span class="ca-toolbar__more">
      <DropdownMenu align="end">
        {#snippet triggerChild(props)}
          <IconButton {...props} variant="text" size="sm" aria-label={moreLabel ?? t().toolbar.more}>
            <Ellipsis size={16} />
          </IconButton>
        {/snippet}
        {#each moved as item (item.el)}
          <DropdownMenuItem disabled={item.disabled} onclick={() => item.el.click()}>{item.label}</DropdownMenuItem>
        {/each}
      </DropdownMenu>
    </span>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    /* One wrapping row. Fields inside size to their content (`width: auto`) instead of filling the
       row, so a Select, a TextField and a Button sit side by side without a wrapper div per field. */
    .ca-toolbar {
      --ca-field-width: auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-toolbar-gap, var(--ca-space-2));
      min-width: 0;
    }

    /* `scroll`: one line, scrolls sideways, no scrollbar drawn; items keep their size. */
    .ca-toolbar[data-overflow='scroll'] {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .ca-toolbar[data-overflow='scroll']::-webkit-scrollbar {
      display: none;
    }
    .ca-toolbar[data-overflow='scroll'] > :global(*) {
      flex: none;
    }

    /* `menu`: one line; what does not fit is hidden here and listed in the More menu. */
    .ca-toolbar[data-overflow='menu'] {
      flex-wrap: nowrap;
    }
    .ca-toolbar[data-overflow='menu'] > :global(*:not(.ca-toolbar-spacer)) {
      flex: none;
    }
    .ca-toolbar[data-overflow='menu'] > :global([data-overflowed]) {
      display: none;
    }
    .ca-toolbar__more {
      display: none;
      flex: none;
    }
    .ca-toolbar__more[data-shown],
    .ca-toolbar__more[data-measuring] {
      display: inline-flex;
    }
}
</style>

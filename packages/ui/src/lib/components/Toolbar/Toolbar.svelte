<script lang="ts">
  import { Ellipsis } from '@lucide/svelte';
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { toolbar } from '../../i18n/groups/toolbar.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { devWarn } from '../../utils/dev-warn.js';
  import { layoutOverflow, observeOverflow, overflowItems, type MovedItem } from '../../utils/overflow.js';
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
     * the items that do not fit into a "More" menu at the end. A direct child moves when it is a `button`
     * or `a[href]`, or carries `data-overflow` and holds one; a `ButtonGroup`, a field or a `data-priority="primary"`
     * item never moves. `data-overflow="Label"` names the menu entry (default: its `aria-label`, then its text).
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

  let root = $state<HTMLElement | null>(null);
  let moved = $state.raw<MovedItem[]>([]);

  $effect(() => {
    if (overflow !== 'menu' || !root) {
      moved = [];
      return;
    }
    const bar = root;
    const layout = () => {
      const next = layoutOverflow(bar, {
        trigger: bar.querySelector<HTMLElement>(':scope > .ca-toolbar__more'),
        previous: untrack(() => moved),
      });
      if (next) moved = next;
    };
    layout();
    return observeOverflow(bar, () => overflowItems(bar), layout);
  });
</script>

<div bind:this={root} {...rest} role="toolbar" class="ca-toolbar {className}" data-overflow={overflow}>
  {@render children?.()}
  {#if overflow === 'menu'}
    <span class="ca-toolbar__more">
      <DropdownMenu align="end">
        {#snippet triggerChild(props)}
          <IconButton {...props} variant="ghost" size="sm" aria-label={moreLabel ?? t().toolbar.more}>
            <Ellipsis size={16} />
          </IconButton>
        {/snippet}
        {#each moved as item (item.el)}
          <DropdownMenuItem disabled={item.disabled} onclick={item.activate}>{item.label}</DropdownMenuItem>
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
    .ca-toolbar[data-overflow='scroll'] > :global(*:not(.ca-toolbar-spacer)) {
      flex: none;
    }
    /* Scrolling clips at the padding box, so the items' focus rings need room in it; the negative
       margin takes it back so the row keeps its layout size. */
    .ca-toolbar[data-overflow='scroll'] {
      --ca-toolbar-ring: calc(var(--ca-border-width-focus) + var(--ca-focus-ring-offset));
      padding: var(--ca-toolbar-ring);
      margin: calc(var(--ca-toolbar-ring) * -1);
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

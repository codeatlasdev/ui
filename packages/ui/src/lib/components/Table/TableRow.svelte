<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLTableRowElement>, 'children' | 'onclick' | 'onkeydown'> {
    children?: Snippet;
    /** Marks the row `aria-selected` and paints the selected tint (pinned cells stay opaque). */
    selected?: boolean;
    /**
     * Makes the row interactive: reachable by Tab, activates on click, Enter and Space, with an inset
     * focus ring. Events from inline controls (checkbox, button, link, menu, input) never activate it.
     */
    onactivate?: (event: MouseEvent | KeyboardEvent) => void;
  }
  let { children, selected = undefined, onactivate, class: className = '', ...rest }: Props = $props();

  /** True when the event came from a control inside the row, which owns it. */
  const CONTROL = 'a[href], button, input, select, textarea, summary, label, [role="button"], [role="checkbox"], [role="menuitem"], [role="switch"], [role="link"], [contenteditable=""], [contenteditable="true"], [data-row-ignore]';
  function fromControl(e: Event, row: HTMLElement): boolean {
    const hit = (e.target as Element | null)?.closest(CONTROL);
    return !!hit && row.contains(hit);
  }

  function onclick(e: MouseEvent) {
    if (!onactivate || fromControl(e, e.currentTarget as HTMLElement)) return;
    onactivate(e);
  }
  function onkeydown(e: KeyboardEvent) {
    if (!onactivate || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onactivate(e);
    }
  }
</script>

<!-- A row with `onactivate` is a keyboard-operable control (tabindex, Enter/Space); a plain row stays inert markup. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
<tr
  {...rest}
  data-row
  class="{className}"
  class:ca-table-row--interactive={!!onactivate}
  aria-selected={selected === undefined ? undefined : selected}
  tabindex={onactivate ? 0 : undefined}
  onclick={onactivate ? onclick : undefined}
  onkeydown={onactivate ? onkeydown : undefined}
>
  {@render children?.()}
</tr>

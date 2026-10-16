<script lang="ts">
  import type { Snippet } from 'svelte';
  import { keyboardAware } from '../../actions/keyboard-aware.js';

  /**
   * StickyActions: primary action bar for a form.
   *
   * Sticks to the bottom of the scrolling container (`position: sticky; bottom: 0`) with
   * glass chrome, honoring `--ca-safe-bottom` and the virtual keyboard
   * (`keyboardAware`). On wide screens it becomes an inline row with no chrome.
   *
   * Usage:
   *   <StickyActions show={dirty}>
   *     <Button variant="ghost">Cancel</Button>
   *     <Button variant="filled">Save</Button>
   *   </StickyActions>
   */
  interface Props {
    /** Bar buttons. */
    children: Snippet;
    /** `'end'` packs the buttons to the right; `'stretch'` stretches them (full width) on touch screens. */
    align?: 'end' | 'stretch';
    /** Renders the bar only while there is something to confirm (e.g. a dirty form). */
    show?: boolean;
    class?: string;
  }

  let { children, align = 'end', show = true, class: className = '' }: Props = $props();
</script>

{#if show}
  <div class="ca-sticky-actions ca-sticky-actions--{align} {className}" data-ca-blur="regular" data-ca-blur-wide-off use:keyboardAware>
    <div class="ca-sticky-actions__inner">{@render children()}</div>
  </div>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-sticky-actions {
      position: sticky;
      bottom: 0;
      z-index: var(--ca-z-sticky);
      /* Bleeds to the panel edges so the blur covers the content scrolling underneath. */
      margin: var(--ca-space-2) calc(var(--ca-page-px-sm) * -1) 0;
      padding: var(--ca-space-3) max(var(--ca-page-px-sm), var(--ca-safe-right)) calc(var(--ca-space-3) + var(--ca-safe-bottom)) max(var(--ca-page-px-sm), var(--ca-safe-left));
      background: var(--ca-glass-bg);
      box-shadow: inset 0 var(--ca-border-width) 0 var(--ca-outline-subtle);
    }

    .ca-sticky-actions__inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ca-space-2);
    }

    .ca-sticky-actions--end .ca-sticky-actions__inner {
      justify-content: flex-end;
    }

    .ca-sticky-actions__inner :global(.ca-btn) {
      min-height: var(--ca-touch-target);
    }

    /* Touch screens: stretched buttons; ghost stays compact next to the primary. */
    @media (pointer: coarse) {
      .ca-sticky-actions--stretch .ca-sticky-actions__inner {
        flex-wrap: nowrap;
      }
      .ca-sticky-actions--stretch .ca-sticky-actions__inner > :global(.ca-btn) {
        flex: 1;
        width: 100%;
      }
      .ca-sticky-actions--stretch .ca-sticky-actions__inner > :global(.ca-btn--ghost) {
        flex: 0 0 auto;
        width: auto;
      }
    }

    /* Desktop: inline row, no chrome. */
    @media (min-width: 900px) {
      .ca-sticky-actions {
        position: static;
        margin: 0;
        padding: 0;
        background: none;
        box-shadow: none;
      }
    }
}
</style>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Accessible name of the group ("Filter chats"). */
    label: string;
    /** Wrap onto several lines instead of scrolling sideways. No scroller, so nothing clips. */
    wrap?: boolean;
    /** Size of the chips in the row (their hit-area room is computed from it). Default `md`. */
    size?: 'sm' | 'md';
    /** Fade the edges where more chips are hidden. Ignored with `wrap`. */
    fade?: boolean;
    class?: string;
    children: Snippet;
  }

  let { label, wrap = false, size = 'md', fade = false, class: className = '', children }: Props = $props();
</script>

<!-- A group of chips. The scroller reserves the vertical room of the chips' touch hit area itself (and
     cancels it with a negative margin), because a scroller clips and hit-tests only inside its padding box. -->
<div
  class="ca-chip-row {className}"
  class:ca-chip-row--wrap={wrap}
  class:ca-chip-row--sm={size === 'sm'}
  class:ca-chip-row--fade={fade && !wrap}
  role="group"
  aria-label={label}
>
  {@render children()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-chip-row {
      /* Height of the row's chips, for the hit-area room below (the md chip height; `size="sm"` the sm one). */
      --ca-chip-row-h: var(--ca-space-7);
      display: flex;
      gap: var(--ca-space-1-5);
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
    }
    .ca-chip-row--sm { --ca-chip-row-h: var(--ca-space-5); }
    .ca-chip-row::-webkit-scrollbar { display: none; }
    .ca-chip-row > :global(*) { flex-shrink: 0; }

    .ca-chip-row--wrap { flex-wrap: wrap; overflow: visible; }

    /* Touch: the chips overhang by (touch target - chip height) / 2 above and below; give that room to the
       scroller and take it back from the layout so the row keeps the height of its chips. */
    @media (pointer: coarse) {
      .ca-chip-row:not(.ca-chip-row--wrap) {
        padding-block: max(0px, calc((var(--ca-touch-target) - var(--ca-chip-row-h)) / 2));
        margin-block: calc(-1 * max(0px, (var(--ca-touch-target) - var(--ca-chip-row-h)) / 2));
      }
    }

    .ca-chip-row--fade {
      -webkit-mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-3), #000 calc(100% - var(--ca-space-6)), transparent);
      mask-image: linear-gradient(to right, transparent, #000 var(--ca-space-3), #000 calc(100% - var(--ca-space-6)), transparent);
    }
}
</style>

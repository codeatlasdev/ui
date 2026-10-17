<script lang="ts">
  import type { Dnd } from '../../primitives/dnd.svelte.js';

  interface Props {
    /** The instance returned by `useDnd()`. */
    dnd: Dnd;
  }

  let { dnd }: Props = $props();
</script>

<!--
  Render once next to the lists that use `dnd`. It holds the keyboard instructions (point a handle's
  aria-describedby at `dnd.instructionsId`) and the styles of the overlay, the drop indicator and the
  data-dnd-* states, so apps that never drag pay nothing for them.
-->
<p id={dnd.instructionsId} class="ca-sr-only">{dnd.instructions}</p>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  :global(.ca-dnd-overlay) {
    position: fixed;
    inset: 0 auto auto 0;
    z-index: var(--ca-z-tooltip);
    margin: 0;
    pointer-events: none;
    opacity: 0.95;
    box-shadow: var(--ca-shadow-lg);
    cursor: grabbing;
    will-change: transform;
  }
  :global(.ca-dnd-indicator) {
    position: fixed;
    inset: 0 auto auto 0;
    z-index: var(--ca-z-tooltip);
    pointer-events: none;
    background: var(--ca-brand-fill);
    border-radius: var(--ca-radius-pill);
  }
  :global(.ca-dnd-indicator[data-axis="y"]) { height: 2px; }
  :global(.ca-dnd-indicator[data-axis="x"]) { width: 2px; }

  :global([data-dnd-item]) { touch-action: manipulation; }
  :global([data-dnd-item][data-dnd-pressing]) {
    touch-action: none;
    transform: scale(0.985);
    transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
  }
  /* The source stays fully legible (a dimmed one fails contrast and hides what is held). */
  :global([data-dnd-item][data-dnd-dragging]) {
    outline: 2px dashed var(--ca-outline-strong);
    outline-offset: -2px;
  }
  :global([data-dnd-zone][data-dnd-over]) {
    outline: 2px dashed var(--ca-brand-fill);
    outline-offset: -2px;
  }
  :global(html[data-dnd-active]) {
    cursor: grabbing;
    -webkit-user-select: none;
    user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    :global([data-dnd-item][data-dnd-pressing]) { transform: none; transition: none; }
  }

  @media (forced-colors: active) {
    :global(.ca-dnd-indicator) { background: Highlight; forced-color-adjust: none; }
    :global(.ca-dnd-overlay) { border: 2px solid CanvasText; box-shadow: none; }
    :global([data-dnd-item][data-dnd-dragging]) { outline-color: CanvasText; }
    :global([data-dnd-zone][data-dnd-over]) { outline-color: Highlight; }
  }
}
</style>

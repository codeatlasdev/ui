<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * StrikeThrough: a hand-drawn strike on a `<del>` (the text is "removed", which assistive tech
   * announces). With `animated` the line draws left to right on mount (`--ca-ease-out-quart`);
   * under `prefers-reduced-motion` or `--ca-motion-scale: 0` it renders fully drawn, no animation.
   * Color: `--ca-strike-color` (defaults to the error color).
   *
   *   <StrikeThrough animated>slow</StrikeThrough> fast
   */
  interface Props {
    /** Draw the line in on mount. */
    animated?: boolean;
    class?:    string;
    children?: Snippet;
  }

  let { animated = false, class: className = '', children }: Props = $props();
</script>

<del class="ca-strike {className}" class:ca-strike--animated={animated}>{@render children?.()}</del>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-strike {
      position: relative;
      display: inline-block;
      text-decoration: none;
    }

    .ca-strike::after {
      content: '';
      position: absolute;
      inset-inline: -0.06em;
      top: 54%;
      height: max(2px, 0.08em);
      border-radius: var(--ca-radius-pill);
      background: var(--ca-strike-color, var(--ca-semantic-error, currentColor));
      transform: rotate(-1.2deg) scaleX(1);
      transform-origin: left center;
      pointer-events: none;
    }

    .ca-strike--animated::after {
      animation: ca-strike-draw calc(var(--ca-duration-slow) * 2.5) var(--ca-ease-out-quart) both;
    }

    @keyframes ca-strike-draw {
      from { transform: rotate(-1.2deg) scaleX(0); }
      to   { transform: rotate(-1.2deg) scaleX(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-strike--animated::after { animation: none; }
    }
}
@media (forced-colors: active) {
  .ca-strike { text-decoration: line-through; }
  .ca-strike::after { display: none; }
}
</style>

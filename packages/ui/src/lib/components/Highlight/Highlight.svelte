<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Highlight: a marker-pen `<mark>`. With `animated` the marker sweeps in on mount
   * (`--ca-ease-out-expo`); under `prefers-reduced-motion` or `--ca-motion-scale: 0` it renders
   * its final state with no animation. Color: `--ca-highlight-color` (defaults to a brand tint).
   *
   *   Ship <Highlight animated>faster</Highlight>.
   */
  interface Props {
    /** Sweep the marker in on mount. */
    animated?: boolean;
    class?:    string;
    children?: Snippet;
  }

  let { animated = false, class: className = '', children }: Props = $props();
</script>

<mark class="ca-highlight {className}" class:ca-highlight--animated={animated}>{@render children?.()}</mark>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-highlight {
      color: inherit;
      padding-inline: 0.12em;
      margin-inline: -0.12em;
      border-radius: var(--ca-radius-xs);
      background-color: transparent;
      background-image: linear-gradient(var(--ca-highlight-color, color-mix(in oklab, var(--ca-brand-main) 38%, transparent)), var(--ca-highlight-color, color-mix(in oklab, var(--ca-brand-main) 38%, transparent)));
      background-repeat: no-repeat;
      background-position: 0 85%;
      background-size: 100% 0.55em;
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
    }

    .ca-highlight--animated {
      animation: ca-highlight-sweep calc(var(--ca-duration-slow) * 3) var(--ca-ease-out-expo) both;
    }

    @keyframes ca-highlight-sweep {
      from { background-size: 0% 0.55em; }
      to   { background-size: 100% 0.55em; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ca-highlight--animated { animation: none; }
    }
}
@media (forced-colors: active) {
  .ca-highlight { background: Mark; color: MarkText; forced-color-adjust: none; }
}
</style>

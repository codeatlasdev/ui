<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  /**
   * AspectRatio — a box that keeps `width / height = ratio` for whatever it holds.
   *
   * For a video, an iframe, a map or any child without intrinsic size. A direct `img`, `video`,
   * `iframe`, `canvas` or `svg` child fills the box (images and video are cropped, `object-fit: cover`).
   * For a plain picture use `<Image ratio>` instead.
   *
   * <AspectRatio ratio={16 / 9}><iframe title="Demo" src="…" /></AspectRatio>
   */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
    /** Width divided by height: `16 / 9`, `1`, `4 / 3`. */
    ratio: number;
    class?: string;
    children?: Snippet;
  }

  let { ratio, class: className = '', children, ...rest }: Props = $props();
</script>

<div {...rest} class="ca-aspect {className}" style:--ca-aspect={ratio > 0 ? ratio : 1}>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-aspect {
      position: relative;
      width: 100%;
      aspect-ratio: var(--ca-aspect, 1);
      overflow: hidden;
    }
    /* The ratio owns the size: a child fills it and can never push it taller. */
    .ca-aspect > :global(:is(img, video, iframe, canvas, svg)) {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      object-fit: cover;
    }
}
</style>

<script lang="ts">
  import { DEV } from 'esm-env';
  import type { HTMLImgAttributes } from 'svelte/elements';

  /**
   * Image — zero layout shift, lazy by default.
   *
   * `width` and `height` are required: the browser reserves the aspect ratio before the
   * file arrives (no CLS). `alt` is required; a decorative image passes `decorative`.
   * `priority` is for the single above-the-fold image (LCP): eager load, high fetch
   * priority and a <link rel="preload"> in <head>.
   *
   * <Image src="/hero.avif" alt="Dashboard overview" width={1200} height={630} priority />
   * <Image src="/dots.svg" alt="" decorative width={64} height={64} />
   * <Image src="/a.jpg" srcset="/a-480.jpg 480w, /a-960.jpg 960w" sizes="(min-width: 768px) 50vw, 100vw"
   *        alt="Team" width={960} height={640} />
   *
   * For AVIF/WebP generation use @sveltejs/enhanced-img (see the Performance guide).
   */
  interface Props
    extends Omit<HTMLImgAttributes, 'src' | 'alt' | 'width' | 'height' | 'class' | 'loading' | 'decoding' | 'fetchpriority'> {
    src: string;
    /** Describes the image. Use `decorative` instead of an empty string. */
    alt: string;
    /** Intrinsic width in pixels. Together with `height` it fixes the aspect ratio (zero CLS). */
    width: number;
    /** Intrinsic height in pixels. */
    height: number;
    /** Marks the image as decoration: renders `alt=""` and hides it from assistive tech. */
    decorative?: boolean;
    /** Above-the-fold (LCP) image: eager, `fetchpriority="high"` and a preload link in <head>. */
    priority?: boolean;
    /** Overrides the default (`lazy`, or `eager` with `priority`). */
    loading?: 'lazy' | 'eager';
    /** @default 'async' */
    decoding?: 'async' | 'sync' | 'auto';
    class?: string;
  }

  let {
    src,
    alt,
    width,
    height,
    decorative = false,
    priority = false,
    loading,
    decoding = 'async',
    srcset,
    sizes,
    class: className = '',
    ...rest
  }: Props = $props();

  // esm-env resolves DEV per bundler condition; production builds drop the block.
  if (DEV) {
    $effect(() => {
      const where = `<Image src="${src}">`;
      if (!(width > 0) || !(height > 0))
        console.warn(`[ca-ui] ${where}: width and height are required to reserve space and avoid layout shift.`);
      if (alt === '' && !decorative)
        console.warn(`[ca-ui] ${where}: alt="" hides the image from screen readers. Describe it, or pass \`decorative\` if it carries no meaning.`);
      if (decorative && alt !== '')
        console.warn(`[ca-ui] ${where}: \`decorative\` ignores alt="${alt}". Drop one of them.`);
    });
  }
</script>

<svelte:head>
  {#if priority}
    <link rel="preload" as="image" href={src} imagesrcset={srcset} imagesizes={sizes} fetchpriority="high" />
  {/if}
</svelte:head>

<img
  {...rest}
  {src}
  {srcset}
  {sizes}
  {width}
  {height}
  alt={decorative ? '' : alt}
  aria-hidden={decorative ? 'true' : undefined}
  loading={loading ?? (priority ? 'eager' : 'lazy')}
  fetchpriority={priority ? 'high' : undefined}
  {decoding}
  class={['ca-image', className]}
/>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-image) {
      display: block;
      max-width: 100%;
      /* width/height attributes give the aspect ratio; height:auto keeps it when max-width shrinks the box. */
      height: auto;
    }
}
</style>

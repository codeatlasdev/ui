<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { carousel } from '../../i18n/groups/carousel.js';
  import { CAROUSEL_KEY, type CarouselContext } from './carousel-context.js';
  const t = useMessages(carousel);

  /** One slide of a `Carousel`. A slide that is out of view is inert: not focusable, not read. */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'role'> {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children, ...rest }: Props = $props();

  const ctx = getContext<CarouselContext>(CAROUSEL_KEY);
  let el = $state<HTMLElement>();
  let index = $state(-1);

  onMount(() => (el ? ctx.register(el) : undefined));
  $effect(() => {
    void ctx.count();
    if (el) index = ctx.indexOf(el);
  });

  const shown = $derived(index < 0 || ctx.visible(index));
</script>

<div
  {...rest}
  bind:this={el}
  role="group"
  aria-roledescription="slide"
  aria-label={index < 0 ? undefined : t().carousel.slide(index + 1, ctx.count())}
  aria-hidden={shown ? undefined : 'true'}
  inert={!shown}
  class="ca-carousel__item {className}"
>
  {@render children?.()}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-carousel__item {
      flex: 0 0 calc(100% / var(--ca-carousel-per-view, 1));
      min-width: 0;
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
}
</style>

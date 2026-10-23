<script lang="ts">
  import Carousel from './Carousel.svelte';
  import CarouselItem from './CarouselItem.svelte';

  let {
    count = 4,
    autoplay,
    loop = false,
    index = $bindable(0),
    onchange,
    perView = 1,
    plain = false,
    flexed = false,
  }: {
    count?: number;
    autoplay?: number;
    loop?: boolean;
    index?: number;
    onchange?: (i: number) => void;
    perView?: number;
    /** Slides without a focusable child (the common marketing case). */
    plain?: boolean;
    /** Sit in a narrow flex row as a flex item, the way a docs demo does. */
    flexed?: boolean;
  } = $props();
</script>

<div class={flexed ? "row" : "host"}>
  <div class={flexed ? "item" : undefined}>
  <Carousel label="Highlights" {autoplay} {loop} bind:index {onchange} {perView}>
    {#each Array.from({ length: count }, (_, i) => i) as i (i)}
      <CarouselItem><div class="slide">{#if plain}A slide with a rather long unwrapped caption {i + 1}{:else}<button type="button">Slide {i + 1} action</button>{/if}</div></CarouselItem>
    {/each}
  </Carousel>
  </div>
</div>

<style>
  .host { width: 400px; }
  .row { display: flex; flex-wrap: wrap; width: 263px; }
  .item { max-width: 28rem; }
  .slide { height: 120px; display: grid; place-items: center; white-space: nowrap; }
</style>

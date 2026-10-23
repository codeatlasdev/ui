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
  }: {
    count?: number;
    autoplay?: number;
    loop?: boolean;
    index?: number;
    onchange?: (i: number) => void;
    perView?: number;
  } = $props();
</script>

<div class="host">
  <Carousel label="Highlights" {autoplay} {loop} bind:index {onchange} {perView}>
    {#each Array.from({ length: count }, (_, i) => i) as i (i)}
      <CarouselItem><div class="slide"><button type="button">Slide {i + 1} action</button></div></CarouselItem>
    {/each}
  </Carousel>
</div>

<style>
  .host { width: 400px; }
  .slide { height: 120px; display: grid; place-items: center; }
</style>

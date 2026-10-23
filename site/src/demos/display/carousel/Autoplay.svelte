<script lang="ts">
  import { Carousel, CarouselItem } from '@codeatlasdev/ui';

  const quotes = ['"Setup took ten minutes."', '"The keyboard support is real."', '"Our audit passed first time."'];
</script>

<div class="frame">
  <Carousel label="Customer quotes" autoplay={4000} loop arrows={false}>
    {#each quotes as quote (quote)}
      <CarouselItem><blockquote class="quote">{quote}</blockquote></CarouselItem>
    {/each}
  </Carousel>
</div>

<style>
  .frame { max-width: 28rem; }
  .quote {
    display: grid;
    place-items: center;
    height: 7rem;
    margin: 0;
    padding-inline: var(--ca-space-4);
    color: var(--ca-text-primary);
    font-size: var(--ca-font-size-h5);
    text-align: center;
  }
</style>

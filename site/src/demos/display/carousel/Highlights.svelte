<script lang="ts">
  import { Carousel, CarouselItem } from '@codeatlasdev/ui';

  const slides = ['Plan', 'Build', 'Ship', 'Learn'];
  let index = $state(0);
</script>

<div class="frame">
  <Carousel label="Product highlights" bind:index>
    {#each slides as title (title)}
      <CarouselItem><div class="slide">{title}</div></CarouselItem>
    {/each}
  </Carousel>
</div>
<p class="note">Slide {index + 1} of {slides.length}. Swipe, use the buttons, or focus the carousel and press the arrow keys.</p>

<style>
  .frame { max-width: 28rem; }
  .slide {
    display: grid;
    place-items: center;
    height: 9rem;
    margin-inline: var(--ca-space-1);
    border-radius: var(--ca-radius-md);
    background: var(--ca-surface-sunken);
    color: var(--ca-text-primary);
    font-size: var(--ca-font-size-h4);
  }
  .note { margin: var(--ca-space-2) 0 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
</style>

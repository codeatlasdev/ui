<script lang="ts">
  import { Carousel, CarouselItem } from '@codeatlasdev/ui';

  const cards = ['Starter', 'Team', 'Business', 'Enterprise', 'Partner'];
</script>

<div class="frame">
  <Carousel label="Plans" perView={3} loop>
    {#each cards as name (name)}
      <CarouselItem><div class="card">{name}</div></CarouselItem>
    {/each}
  </Carousel>
</div>

<style>
  .frame { max-width: 36rem; }
  .card {
    display: grid;
    place-items: center;
    height: 6rem;
    margin-inline: var(--ca-space-1);
    border: var(--ca-border-width) solid var(--ca-outline-default);
    border-radius: var(--ca-radius-md);
    color: var(--ca-text-primary);
  }
</style>

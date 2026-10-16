<script lang="ts">
  import { Button, MotionStage } from '@codeatlasdev/ui';

  const logos = [
    { name: 'Northwind', href: '#northwind' },
    { name: 'Lumen Health', href: '#lumen' },
    { name: 'Kestrel Freight', href: '#kestrel' },
    { name: 'Orbit Pay', href: '#orbit' },
    { name: 'Fjord Energy', href: '#fjord' },
    { name: 'Atlas Bank', href: '#atlas' }
  ];

  // Takeover: the Back and Forward buttons nudge the strip by hand, 56px per press, once autoplay has stopped.
  let nudge = $state(0);
</script>

<MotionStage label="Marquee: partner names scroll endlessly and pause on hover or focus" loop={4000}>
  {#snippet children(m)}
    <div class="mq">
      <p class="mq__eyebrow" id="mq-eyebrow">Trusted by 1,200 finance teams</p>
      <div class="mq__viewport" role="group" aria-labelledby="mq-eyebrow">
        <ul class="mq__track" class:mq__track--run={m.playing && !m.reduced} style="--nudge:{nudge}px">
          {#each logos as l (l.name)}
            <li><a class="mq__item" href={l.href}>{l.name}</a></li>
          {/each}
          <!-- Second copy closes the loop: the track moves -50% and lands on an identical frame. -->
          {#each logos as l (l.name)}
            <li aria-hidden="true"><a class="mq__item" href={l.href} tabindex="-1">{l.name}</a></li>
          {/each}
        </ul>
      </div>
      <div class="mq__bar">
        <p class="mq__hint">Hover or focus a name to pause.</p>
        <Button size="sm" variant="ghost" onclick={() => (nudge += 56)}>Back</Button>
        <Button size="sm" variant="ghost" onclick={() => (nudge -= 56)}>Forward</Button>
      </div>
    </div>
  {/snippet}
</MotionStage>

<style>
  .mq { display: grid; gap: var(--ca-space-3); inline-size: 100%; max-width: 32rem; }
  .mq__bar { display: flex; align-items: center; gap: var(--ca-space-2); }
  .mq__bar .mq__hint { flex: 1; }
  .mq__eyebrow, .mq__hint { margin: 0; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
  .mq__viewport {
    overflow: hidden;
    border-block: 1px solid var(--ca-outline-subtle);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  }
  .mq__track {
    display: flex;
    inline-size: max-content;
    gap: var(--ca-space-8);
    margin: 0;
    padding: var(--ca-space-3) var(--ca-space-4);
    list-style: none;
    transform: translateX(var(--nudge));
    transition: transform 240ms cubic-bezier(0.2, 0, 0, 1);
  }
  .mq__track--run { animation: mq-slide 18s linear infinite; transition: none; }
  /* Hover or keyboard focus anywhere in the strip freezes it so a name can be read or clicked. */
  .mq__viewport:hover .mq__track,
  .mq__viewport:focus-within .mq__track { animation-play-state: paused; }
  .mq__item {
    font-family: var(--ca-font-display);
    font-size: var(--ca-font-size-h5);
    font-weight: var(--ca-font-weight-heading);
    color: var(--ca-text-secondary);
    text-decoration: none;
    white-space: nowrap;
  }
  .mq__item:hover, .mq__item:focus-visible { color: var(--ca-brand-text); }
  .mq__item:focus-visible { outline: 2px solid var(--ca-focus-ring); outline-offset: 4px; border-radius: var(--ca-radius-sm); }
  @keyframes mq-slide {
    from { transform: translateX(var(--nudge)); }
    to { transform: translateX(calc(var(--nudge) - 50%)); }
  }
</style>

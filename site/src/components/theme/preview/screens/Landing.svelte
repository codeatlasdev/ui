<script lang="ts">
  import { Button, Card, Chip, Heading } from '@codeatlasdev/ui';
  import { ArrowRight, Layers, Palette, ShieldCheck, Sparkles } from '@lucide/svelte';

  const features = [
    { icon: Palette, title: 'One theme object', body: 'Colors, type, radius and motion live in a single typed config.' },
    { icon: Layers, title: 'Composable parts', body: 'Every component reads the same tokens, so nothing drifts.' },
    { icon: ShieldCheck, title: 'Accessible by default', body: 'Contrast is checked per preset and scheme before you ship.' },
  ];
  const logos = ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbrella'];
</script>

<section class="ts-landing" aria-label="Landing page preview">
  <div class="ts-landing__hero">
    <Chip label="New: theme studio" variant="brand" size="sm" icon={Sparkles} />
    <div class="ts-landing__title"><Heading level={2} size="display">Ship an interface that feels like yours</Heading></div>
    <p class="ts-landing__lead">
      Design tokens, components and charts that follow one theme. Edit it live, copy the code, ship.
    </p>
    <div class="ts-landing__cta">
      <Button size="lg">
        Get started
        {#snippet trailing()}<ArrowRight size={16} />{/snippet}
      </Button>
      <Button variant="outlined" size="lg">Read the docs</Button>
    </div>
  </div>

  <ul class="ts-landing__features" aria-label="Features">
    {#each features as f (f.title)}
      {@const Icon = f.icon}
      <li>
        <Card full>
          <div class="ts-landing__feature">
            <span class="ts-landing__icon"><Icon size={20} aria-hidden="true" /></span>
            <Heading level={3} size="h5">{f.title}</Heading>
            <p class="ts-landing__body">{f.body}</p>
          </div>
        </Card>
      </li>
    {/each}
  </ul>

  <div class="ts-landing__logos">
    <p class="ts-landing__logos-label">Trusted by product teams at</p>
    <ul class="ts-landing__logo-row" aria-label="Customers">
      {#each logos as l (l)}<li>{l}</li>{/each}
    </ul>
  </div>
</section>

<style>
  .ts-landing { display: grid; gap: var(--ca-space-8); padding: var(--ca-space-6) var(--ca-space-4); min-width: 0; }
  .ts-landing__hero {
    display: grid;
    justify-items: center;
    gap: var(--ca-space-4);
    text-align: center;
    max-width: 44rem;
    margin-inline: auto;
    min-width: 0;
  }
  /* `display` is sized from the viewport; inside a framed preview it must follow the frame. */
  .ts-landing__title :global(.ca-heading) { font-size: clamp(1.75rem, 9cqi, 3.5rem); }
  .ts-landing__lead { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body1); line-height: var(--ca-line-height-body); max-width: 36rem; }
  .ts-landing__cta { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--ca-space-3); }

  .ts-landing__features { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-4); grid-template-columns: minmax(0, 1fr); }
  .ts-landing__features > li { min-width: 0; display: grid; }
  @container ts-island (min-width: 640px) {
    .ts-landing__features { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  .ts-landing__feature { display: grid; gap: var(--ca-space-2); justify-items: start; }
  .ts-landing__icon {
    display: grid;
    place-items: center;
    width: var(--ca-control-height);
    height: var(--ca-control-height);
    border-radius: var(--ca-radius-md);
    background: color-mix(in oklab, var(--ca-brand-fill) 14%, transparent);
    color: var(--ca-brand-text);
  }
  .ts-landing__body { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }

  .ts-landing__logos { display: grid; justify-items: center; gap: var(--ca-space-3); }
  .ts-landing__logos-label { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); }
  .ts-landing__logo-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ca-space-3) var(--ca-space-6);
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--ca-font-display);
    font-weight: var(--ca-font-weight-heading);
    color: var(--ca-text-secondary);
  }
</style>

<script lang="ts">
  import { Button, Card, Chip, Heading } from '@codeatlasdev/ui';
  import { Check } from '@lucide/svelte';

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      blurb: 'For side projects and trials.',
      features: ['1 workspace', '3 members', 'Community support'],
      cta: 'Start free',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$29',
      blurb: 'For teams shipping every week.',
      features: ['Unlimited workspaces', '20 members', 'Priority support', 'Audit log'],
      cta: 'Start 14-day trial',
      featured: true,
    },
    {
      name: 'Scale',
      price: '$99',
      blurb: 'For orgs with compliance needs.',
      features: ['SSO and SCIM', 'Unlimited members', 'Dedicated manager', 'Custom contracts'],
      cta: 'Talk to sales',
      featured: false,
    },
  ];
</script>

<section class="ts-pricing" aria-label="Pricing preview">
  <header class="ts-pricing__head">
    <Heading level={2} size="h2">Simple pricing</Heading>
    <p class="ts-pricing__lead">Pay for what you use. Cancel any time.</p>
  </header>

  <ul class="ts-pricing__plans" aria-label="Plans">
    {#each plans as p (p.name)}
      <li>
        <Card
          full
          padding="lg"
          tone={p.featured ? 'brand' : 'neutral'}
          variant={p.featured ? 'outlined' : 'filled'}
          elevation={p.featured ? 3 : 1}
        >
          <div class="ts-pricing__plan">
            <div class="ts-pricing__title">
              <Heading level={3} size="h4">{p.name}</Heading>
              {#if p.featured}<Chip label="Most popular" variant="brand" size="sm" />{/if}
            </div>
            <p class="ts-pricing__price">
              <span class="ts-pricing__amount">{p.price}</span>
              <span class="ts-pricing__per">/ month</span>
            </p>
            <p class="ts-pricing__blurb">{p.blurb}</p>
            <ul class="ts-pricing__list" aria-label="{p.name} includes">
              {#each p.features as f (f)}
                <li><Check size={16} aria-hidden="true" /><span>{f}</span></li>
              {/each}
            </ul>
            <Button variant={p.featured ? 'filled' : 'outlined'} fullWidth>{p.cta}</Button>
          </div>
        </Card>
      </li>
    {/each}
  </ul>
</section>

<style>
  .ts-pricing { display: grid; gap: var(--ca-space-6); padding: var(--ca-space-6) var(--ca-space-4); min-width: 0; }
  .ts-pricing__head { display: grid; justify-items: center; gap: var(--ca-space-2); text-align: center; }
  .ts-pricing__lead { margin: 0; color: var(--ca-text-secondary); }

  .ts-pricing__plans { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-4); grid-template-columns: minmax(0, 1fr); }
  .ts-pricing__plans > li { min-width: 0; display: grid; }
  @container ts-island (min-width: 720px) {
    .ts-pricing__plans { grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: stretch; }
  }

  .ts-pricing__plan { display: grid; gap: var(--ca-space-3); align-content: start; }
  .ts-pricing__title { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ca-space-2); }
  .ts-pricing__price { margin: 0; display: flex; align-items: baseline; gap: var(--ca-space-1); }
  .ts-pricing__amount {
    font-family: var(--ca-font-display);
    font-weight: var(--ca-font-weight-heading);
    font-size: var(--ca-font-size-h1);
    color: var(--ca-text-primary);
    font-variant-numeric: tabular-nums;
  }
  .ts-pricing__per { color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .ts-pricing__blurb { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .ts-pricing__list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--ca-space-2); }
  .ts-pricing__list li { display: flex; align-items: center; gap: var(--ca-space-2); font-size: var(--ca-font-size-body2); }
  .ts-pricing__list :global(svg) { color: var(--ca-semantic-success); flex: none; }
</style>

<script lang="ts">
  // Before and after on the real components. Both sides render the same markup; only the tokens
  // differ: "before" is the package default, "after" is `designStyle(id)`. A toggle swaps which one
  // fills the stage, "side by side" shows both.
  import {
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Progress,
    SegmentedControl,
    SimpleTable,
    Switch,
    TextField,
    type DesignStyleId,
  } from '@codeatlasdev/ui';
  import { AFTER, BEFORE, beforeCSS } from '~/lib/style-island';
  import type { ShowcaseId } from '~/data/styles/styles';
  import { onMount } from 'svelte';

  interface Props {
    id: DesignStyleId;
    /** `data-style` (surface material) of the recipe. */
    material: string;
    showcases: ShowcaseId[];
    /** `elevation` of the cards. */
    elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  }
  let { id, material, showcases, elevation = 1 }: Props = $props();

  // The page island owns the scheme (its toggle lives in StyleView, a different Astro island), so the
  // stages follow the nearest `ThemeIsland` through the DOM: no state is shared between islands.
  let root = $state<HTMLElement | null>(null);
  let scheme = $state<'light' | 'dark'>('light');
  onMount(() => {
    const island = root?.closest('.ca-theme-island');
    if (!island) return;
    const read = () => (scheme = island.getAttribute('data-theme-scope') === 'dark' ? 'dark' : 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(island, { attributes: true, attributeFilter: ['data-theme-scope'] });
    return () => mo.disconnect();
  });

  type View = 'after' | 'before' | 'both';
  let view = $state<View>('after');
  let name = $state('Ana Lima');
  let notify = $state(true);
  let terms = $state(false);

  const sides = $derived<{ key: 'before' | 'after'; label: string }[]>(
    view === 'both'
      ? [
          { key: 'before', label: 'Before: package default' },
          { key: 'after', label: `After: designStyle("${id}")` },
        ]
      : [
          view === 'after'
            ? { key: 'after', label: `designStyle("${id}")` }
            : { key: 'before', label: 'Package default' },
        ]
  );

  const rows = [
    { name: 'Ana Souza', role: 'Admin', status: 'Active' },
    { name: 'Bruno Lima', role: 'Editor', status: 'Invited' },
    { name: 'Carla Dias', role: 'Viewer', status: 'Active' },
  ];
</script>

<svelte:head>
  {@html `<style data-style-before>${beforeCSS()}</style>`}
</svelte:head>

<div class="sc" bind:this={root}>
  <div class="sc__bar">
    <SegmentedControl
      aria-label="Which tokens the components wear"
      bind:value={view}
      items={[
        { value: 'after', label: 'After' },
        { value: 'before', label: 'Before' },
        { value: 'both', label: 'Side by side' },
      ]}
    />
    <p class="sc__hint">Same components, same markup. Only the tokens change.</p>
  </div>

  <div class="sc__grid" data-both={view === 'both' ? '' : undefined}>
    {#each sides as side (side.key)}
      <figure class="sc__side">
        <figcaption class="sc__cap">{side.label}</figcaption>
        <div
          class="sc__stage {side.key === 'after' ? AFTER : BEFORE}"
          data-ca-tokens
          data-theme-scope={scheme}
          data-style={side.key === 'after' ? material : 'solid'}
          data-testid="sc-{side.key}"
        >
          {#if showcases.includes('actions')}
            <section class="sc__block" aria-label="Buttons and badges">
              <div class="sc__row">
                <Button>Save</Button>
                <Button variant="outlined">Cancel</Button>
                <Button variant="ghost">Learn more</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div class="sc__row">
                <Badge tone="success" subtle dot>Active</Badge>
                <Badge tone="warning" subtle dot>Pending</Badge>
                <Badge tone="danger" subtle dot>Overdue</Badge>
              </div>
            </section>
          {/if}

          {#if showcases.includes('card')}
            <section class="sc__block" aria-label="Card">
              <Card title="Weekly report" headingLevel={4} gap="md" {elevation}>
                <p class="sc__p">Revenue grew in three of four regions. The fourth is waiting on a late import.</p>
                <Progress value={72} label="Import progress" />
                <div class="sc__row">
                  <Button size="sm">Open</Button>
                  <Button size="sm" variant="outlined">Share</Button>
                </div>
              </Card>
            </section>
          {/if}

          {#if showcases.includes('form')}
            <section class="sc__block" aria-label="Form controls">
              <Card gap="md" {elevation}>
                <TextField label="Full name" bind:value={name} description="As on your ID." />
                <Switch bind:checked={notify} label="Email me about changes" />
                <Checkbox bind:checked={terms} label="I accept the terms" />
              </Card>
            </section>
          {/if}

          {#if showcases.includes('feedback')}
            <section class="sc__block" aria-label="Alerts">
              <Alert severity="info" title="Heads up">Your trial ends in 3 days.</Alert>
              <Alert severity="error" title="Payment failed">Check the card and try again.</Alert>
            </section>
          {/if}

          {#if showcases.includes('table')}
            <section class="sc__block" aria-label="Table">
              <Card flush full>
                <SimpleTable>
                  <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {#each rows as r (r.name)}
                      <tr><td class="primary">{r.name}</td><td>{r.role}</td><td>{r.status}</td></tr>
                    {/each}
                  </tbody>
                </SimpleTable>
              </Card>
            </section>
          {/if}
        </div>
      </figure>
    {/each}
  </div>
</div>

<style>
  .sc { display: grid; gap: var(--ca-space-4); min-inline-size: 0; }
  .sc__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3) var(--ca-space-4); }
  .sc__hint { margin: 0; color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .sc__grid { display: grid; gap: var(--ca-space-4); grid-template-columns: minmax(0, 1fr); min-inline-size: 0; }
  @media (min-width: 900px) {
    .sc__grid[data-both] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  .sc__side { margin: 0; display: grid; gap: var(--ca-space-2); min-inline-size: 0; }
  .sc__cap { color: var(--ca-text-secondary); font-size: var(--ca-font-size-caption); font-family: var(--ca-font-mono); }
  .sc__stage {
    display: grid;
    gap: var(--ca-space-5);
    padding: var(--ca-space-5);
    min-inline-size: 0;
    background-color: var(--ca-surface-base);
    background-image: var(--ca-page-mesh);
    color: var(--ca-text-primary);
    font-family: var(--ca-font-sans);
    border: 1px dashed var(--ca-outline-default);
    isolation: isolate;
  }
  .sc__block { display: grid; gap: var(--ca-space-3); min-inline-size: 0; }
  .sc__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-3); }
  .sc__p { margin: 0; color: var(--ca-text-body); }
</style>

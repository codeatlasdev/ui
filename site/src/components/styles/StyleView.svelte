<script lang="ts">
  // The whole interactive body of a style page, rendered inside the recipe: the scheme toggle, the
  // before/after showcase, the live fitting components, apply-to-site. The static prose (origin,
  // traits, claims) is Astro HTML passed in as slots so the evidence blocks stay the shared ones.
  import { type DesignStyleId, SegmentedControl, ThemeIsland } from '@codeatlasdev/ui';
  import type { Snippet } from 'svelte';
  import { afterCSS } from '~/lib/style-island';

  interface Props {
    id: DesignStyleId;
    /** `data-style` (surface material) of the recipe. */
    material: string;
    /** Scheme the page opens in: the recipe's own default, else light. */
    scheme?: 'light' | 'dark';
    children: Snippet;
  }
  let { id, material, scheme: initial = 'light', children }: Props = $props();

  let scheme = $state<'light' | 'dark'>(initial);
</script>

<svelte:head>
  {@html `<style data-style-frame>${afterCSS(id)}</style>`}
</svelte:head>

<ThemeIsland {scheme} class="sx-after sx-frame">
  <div class="sx-surface" data-ca-tokens data-style={material}>
    <div class="sx-scheme">
      <SegmentedControl
        size="sm"
        aria-label="Colour scheme of this page"
        bind:value={scheme}
        items={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    </div>
    {@render children()}
  </div>
</ThemeIsland>

<style>
  .sx-surface {
    min-block-size: inherit;
    background-image: var(--ca-page-mesh);
    font-family: var(--ca-font-sans);
    color: var(--ca-text-primary);
  }
  .sx-scheme { display: flex; justify-content: flex-end; padding: var(--ca-space-3) var(--lp-gutter) 0; }
</style>

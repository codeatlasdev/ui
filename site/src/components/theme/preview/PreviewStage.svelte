<script lang="ts">
  import { ChartScope } from '@codeatlasdev/ui/charts';
  import { ISLAND, islandCSS } from '../studio-output';
  import { familyOf, loadFont } from '../fonts';
  import type { StudioState } from '../studio-state';
  import type { ScreenId } from './screens';
  import Auth from './screens/Auth.svelte';
  import Dashboard from './screens/Dashboard.svelte';
  import Form from './screens/Form.svelte';
  import Landing from './screens/Landing.svelte';
  import List from './screens/List.svelte';
  import Overlays from './screens/Overlays.svelte';
  import Pricing from './screens/Pricing.svelte';
  import Settings from './screens/Settings.svelte';

  interface Props {
    theme: StudioState;
    screen: ScreenId;
    width: 390 | 768 | 1280 | 'fit';
    compare: boolean;
  }
  let { theme, screen, width, compare }: Props = $props();

  const SCREEN = {
    dashboard: Dashboard,
    settings: Settings,
    list: List,
    auth: Auth,
    landing: Landing,
    pricing: Pricing,
    form: Form,
    overlays: Overlays,
  } as const;
  const Current = $derived(SCREEN[screen]);

  // One island per scheme. `system` has no meaning inside a scoped island, so it previews as dark.
  const schemes = $derived<('light' | 'dark')[]>(
    compare ? ['light', 'dark'] : [theme.scheme === 'light' ? 'light' : 'dark']
  );

  // A single text change per token write: the screens are never re-mounted by it.
  const css = $derived(islandCSS(theme));

  // Fonts picked from the curated list load live from Google Fonts (once each).
  $effect(() => {
    for (const stack of [theme.fonts.body, theme.fonts.display, theme.fonts.mono]) {
      const family = familyOf(stack);
      if (family) void loadFont(family);
    }
  });
</script>

<svelte:head>
  {@html `<style data-te-island>${css}</style>`}
</svelte:head>

<div class="ts-stage" data-compare={compare ? '' : undefined}>
  <div class="ts-grid">
    {#each schemes as scheme (scheme)}
      <figure class="ts-device" style={width === 'fit' ? undefined : `--ts-w:${width}px`}>
        <div class="ts-frame" data-fit={width === 'fit' ? '' : undefined}>
          <!-- The island re-derives every token from its own attributes: nothing here reaches the page. -->
          <div
            class="{ISLAND} te-island ts-island"
            data-ca-tokens
            data-theme-scope={scheme}
            data-preset={theme.preset}
            data-style={theme.surface}
            data-testid="te-island"
          >
            <!-- Charts are canvas: they read tokens from this island, not from <html>. -->
            <ChartScope><Current /></ChartScope>
          </div>
        </div>
        <figcaption class="ts-caption">
          {#if compare}<span class="ts-caption__scheme">{scheme === 'light' ? 'Light' : 'Dark'}</span>{/if}
          <span>{width === 'fit' ? 'Fit' : `${width} px`}</span>
        </figcaption>
      </figure>
    {/each}
  </div>
</div>

<style>
  .ts-stage {
    container-type: inline-size;
    container-name: ts-stage;
    min-width: 0;
    width: 100%;
  }
  .ts-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ca-space-4);
    min-width: 0;
  }
  @container ts-stage (min-width: 900px) {
    .ts-stage[data-compare] .ts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  .ts-device {
    display: grid;
    gap: var(--ca-space-2);
    margin: 0;
    min-width: 0;
  }
  .ts-frame {
    min-width: 0;
    overflow: auto;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-outline-subtle);
    background: var(--ca-action-hover);
    padding: var(--ca-space-2);
  }
  .ts-frame[data-fit] { padding: 0; }
  .ts-frame:not([data-fit]) > .ts-island {
    width: var(--ts-w);
    max-width: none;
    margin-inline: auto;
  }

  .ts-island {
    container-type: inline-size;
    container-name: ts-island;
    min-width: 0;
    box-sizing: border-box;
    background: var(--ca-surface-base);
    color: var(--ca-text-primary);
    font-family: var(--ca-font-sans);
    border-radius: var(--ca-radius-lg);
    overflow: clip;
  }

  .ts-caption {
    display: flex;
    justify-content: center;
    gap: var(--ca-space-2);
    font-size: var(--ca-font-size-caption);
    color: var(--ca-text-secondary);
    font-variant-numeric: tabular-nums;
  }
  .ts-caption__scheme { font-weight: var(--ca-font-weight-medium, 600); color: var(--ca-text-primary); }
</style>

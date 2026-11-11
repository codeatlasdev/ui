<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import { KPI_CONTEXT } from '../Stat/context.js';
  import type { IconComponent } from '../../types.js';
  import Card from '../Card/Card.svelte';
  import Stat from '../Stat/Stat.svelte';

  interface Props {
    title:   string;
    value:   string | number;
    unit?:   string;
    /** Secondary caption below the value ("Down from 2.4%"). */
    hint?:   string;
    trend?:  number;
    /** Which direction of `trend` is good news: `'positive-up'` (default colouring), `'positive-down'` (churn, cost, latency) or `'neutral'`. See Stat. */
    trendTone?: 'positive-up' | 'positive-down' | 'neutral';
    /** Lucide icon component; size and color are managed by KpiCard */
    icon?:   IconComponent;
    /**
     * How the icon shows: `'corner'` (default) is the bare 16px icon in the top corner; `'tile'` puts it
     * in a tinted rounded square above the label and sets the number in the large size. Size and tint:
     * `--ca-kpi-tile-size`, `--ca-kpi-tile-bg`.
     */
    iconStyle?: 'corner' | 'tile';
    /** Tint of the icon tile (`iconStyle="tile"` only). Default `brand`. */
    tone?: 'brand' | 'success' | 'warning' | 'error';
    /**
     * A chart under the number, usually `<Sparkline data={...} />` from `@codeatlasdev/ui/charts`.
     * A snippet, not a data prop: the charts subpath (and the `echarts` peer) stays out of the core
     * entry. Give the chart its own accessible name when it carries information.
     */
    chart?: Snippet;
    /** Loading placeholder: same size as the loaded card, announced as busy. */
    skeleton?: boolean;
    class?:  string;
  }

  let { title, value, unit, hint, trend, trendTone, icon: Icon, iconStyle = 'corner', tone = 'brand', chart, skeleton = false, class: className = '' }: Props = $props();

  // Stat renders the `.ca-kpi__*` classes apps target while it sits inside a KpiCard.
  setContext(KPI_CONTEXT, true);

  const tile = $derived(iconStyle === 'tile');
</script>

<!-- A KpiCard is a Stat inside a Card: the label, number and trend typography come from Stat. -->
<Card elevation={3} class="ca-kpi {className}" {skeleton} gap={chart ? 'md' : undefined}>
  <div class="ca-kpi__inner" data-icon-style={Icon && iconStyle === 'tile' ? 'tile' : undefined} data-tone={Icon && iconStyle === 'tile' ? tone : undefined}>
    {#if Icon && tile}
      <span class="ca-kpi__icon" aria-hidden="true">
        <Icon size={20} stroke-width={1.75} />
      </span>
    {/if}
    <Stat label={title} {value} {unit} {hint} {trend} {trendTone} size={tile ? 'lg' : undefined} />
    {#if Icon && !tile}
      <span class="ca-kpi__icon" aria-hidden="true">
        <Icon size={16} stroke-width={1.75} />
      </span>
    {/if}
  </div>
  {#if chart}
    <div class="ca-kpi__chart">{@render chart()}</div>
  {/if}
</Card>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-kpi) { min-width: 0; }

    /* The card already pads its content: the inner box only places the icon beside the label. */
    .ca-kpi__inner {
      position: relative;
      min-width: 0;
    }

    .ca-kpi__chart { min-width: 0; }

    .ca-kpi__icon {
      position: absolute;
      inset-block-start: 0;
      inset-inline-end: 0;
      display: flex;
      align-items: center;
      color: var(--ca-text-hint);
      line-height: 0;
      margin-top: var(--ca-border-width);
    }

    /* Keep the label clear of the icon. */
    .ca-kpi__inner:not([data-icon-style='tile']):has(.ca-kpi__icon) :global(.ca-stat__label) {
      padding-inline-end: var(--ca-space-6);
    }

    /* Tile: the icon sits in flow above the label in a tinted rounded square. */
    .ca-kpi__inner[data-icon-style='tile'] {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ca-space-3);
    }
    .ca-kpi__inner[data-icon-style='tile'] :global(.ca-stat) { align-self: stretch; }
    .ca-kpi__inner[data-icon-style='tile'] .ca-kpi__icon {
      --ca-kpi-tile-tone: var(--ca-brand-main);
      position: static;
      flex-shrink: 0;
      justify-content: center;
      width: var(--ca-kpi-tile-size, var(--ca-space-10));
      height: var(--ca-kpi-tile-size, var(--ca-space-10));
      margin-top: 0;
      border-radius: var(--ca-radius-md);
      color: var(--ca-kpi-tile-fg, var(--ca-kpi-tile-tone));
      background: var(--ca-kpi-tile-bg, color-mix(in oklab, var(--ca-kpi-tile-tone) 14%, transparent));
    }
    .ca-kpi__inner[data-tone='success'] .ca-kpi__icon { --ca-kpi-tile-tone: var(--ca-semantic-success); }
    .ca-kpi__inner[data-tone='warning'] .ca-kpi__icon { --ca-kpi-tile-tone: var(--ca-semantic-warning); }
    .ca-kpi__inner[data-tone='error'] .ca-kpi__icon { --ca-kpi-tile-tone: var(--ca-semantic-error); }
}
</style>

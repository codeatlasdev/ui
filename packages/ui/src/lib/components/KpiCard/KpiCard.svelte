<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
  import type { IconComponent } from '../../types.js';
  import Card from '../Card/Card.svelte';
  const t = useT();

  interface Props {
    title:   string;
    value:   string | number;
    unit?:   string;
    trend?:  number;
    /** Lucide icon component; size and color are managed by KpiCard */
    icon?:   IconComponent;
    class?:  string;
  }

  let { title, value, unit, trend, icon: Icon, class: className = '' }: Props = $props();

  const isUp   = $derived(trend !== undefined && trend > 0);
  const isDown = $derived(trend !== undefined && trend < 0);
  const trendLabel = $derived(
    trend !== undefined ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : null
  );
</script>

<Card elevation={3} class="ca-kpi {className}">
  <div class="ca-kpi__inner">
    <div class="ca-kpi__top">
      <p class="ca-kpi__title">{title}</p>
      {#if Icon}
        <span class="ca-kpi__icon" aria-hidden="true">
          <Icon size={16} stroke-width={1.75} />
        </span>
      {/if}
    </div>

    <div class="ca-kpi__value-row">
      <span class="ca-kpi__value">{value}</span>
      {#if unit}<span class="ca-kpi__unit">{unit}</span>{/if}
    </div>

    {#if trendLabel}
      <span
        class="ca-kpi__trend"
        class:ca-kpi__trend--up={isUp}
        class:ca-kpi__trend--down={isDown}
        aria-label={t().kpiCard.trend(trendLabel)}
      >
        {isUp ? '↑' : isDown ? '↓' : ''}{trendLabel}
      </span>
    {/if}
  </div>
</Card>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    :global(.ca-kpi) { min-width: 0; }

    .ca-kpi__inner {
      padding: var(--ca-card-padding);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1-5);
    }

    .ca-kpi__top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--ca-space-2);
    }

    .ca-kpi__title {
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-secondary);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
      line-height: var(--ca-line-height-snug);
    }

    .ca-kpi__icon {
      display: flex;
      align-items: center;
      color: var(--ca-text-hint);
      flex-shrink: 0;
      line-height: 0;
      margin-top: var(--ca-border-width);
    }

    .ca-kpi__value-row {
      display: flex;
      align-items: baseline;
      gap: var(--ca-space-1);
      margin-top: var(--ca-space-0-5);
    }

    .ca-kpi__value {
      font-size: var(--ca-font-size-h3);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      color: var(--ca-text-primary);
      line-height: 1;
      letter-spacing: var(--ca-heading-tracking);
    }

    .ca-kpi__unit {
      font-size: var(--ca-font-size-body2);
      color: var(--ca-text-secondary);
      font-weight: var(--ca-font-weight-regular);
    }

    .ca-kpi__trend {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-0-5);
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      border-radius: var(--ca-radius-pill);
      padding: var(--ca-space-0-5) var(--ca-space-2);
      align-self: flex-start;
    }

    .ca-kpi__trend--up   { color: var(--ca-semantic-success); background: color-mix(in oklab, var(--ca-semantic-success) 12%, transparent); }
    .ca-kpi__trend--down { color: var(--ca-semantic-error);   background: color-mix(in oklab, var(--ca-semantic-error)   12%, transparent); }

}
</style>

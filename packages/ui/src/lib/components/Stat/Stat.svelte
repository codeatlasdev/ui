<script lang="ts">
  /**
   * Stat — a card-less statistic: label, big number, optional unit, trend and hint.
   * It has no surface, border or padding and inherits its colour from the container, so it sits
   * inside a Card, a panel or a flex/grid row. `KpiCard` is a Stat inside a Card.
   *
   *   <Stat label="Leads this week" value="128" hint="12 more than last week" />
   *   <Stat label="Reply rate" value="18" unit="%" trend={-2.4} size="sm" />
   *
   * Semantics are a description list: the label is the `<dt>`, the value the `<dd>`.
   */
  import { getContext } from 'svelte';
  import { KPI_CONTEXT } from './context.js';
  import { useMessages } from '../../i18n/state.svelte.js';
  import { kpiCard } from '../../i18n/groups/kpiCard.js';
  const t = useMessages(kpiCard);

  interface Props {
    /** What is measured. One line: truncates with an ellipsis when the container is narrow. */
    label: string;
    /** The number (or short text). Tabular numerals, never wraps. */
    value: string | number;
    /** Unit shown after the value (`%`, `ms`, `users`). */
    unit?: string;
    /** Secondary caption below the value ("12 more than last week"). */
    hint?: string;
    /** Percentage change. The arrow follows the sign (up, down, none for zero); the colour follows `trendTone`. */
    trend?: number;
    /**
     * Which direction of `trend` is good news. `'positive-up'` (the colouring without a tone): a rise is green, a fall red.
     * `'positive-down'` (churn, cost, latency): a fall is green, a rise red. `'neutral'`: no judgement, both muted.
     * Setting a tone also makes the accessible label say "better" or "worse"; a zero change is always neutral.
     */
    trendTone?: 'positive-up' | 'positive-down' | 'neutral';
    /** Value size: `'sm'` (17px), `'md'` (24px, the default), `'lg'` (36px). */
    size?: 'sm' | 'md' | 'lg';
    /** Text alignment inside the stat. */
    align?: 'start' | 'center';
    /** Loading placeholder: same size as the loaded stat, announced as busy. */
    skeleton?: boolean;
    class?: string;
  }

  let {
    label, value, unit, hint, trend, trendTone,
    size = 'md',
    align = 'start',
    skeleton = false,
    class: className = '',
  }: Props = $props();

  // Inside a KpiCard the parts also carry its documented `ca-kpi__*` classes (rendered in the markup, so SSR has them).
  const kpi = getContext<boolean | undefined>(KPI_CONTEXT) ? 'ca-kpi' : null;
  const k = (part: string) => (kpi ? ` ${kpi}__${part}` : '');

  const isUp   = $derived(trend !== undefined && trend > 0);
  const isDown = $derived(trend !== undefined && trend < 0);
  const trendLabel = $derived(
    trend !== undefined ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : null
  );
  // good / bad / neutral: the verdict the colour (and, once a tone is set, the label) expresses.
  const verdict = $derived.by(() => {
    if (trendTone === 'neutral' || (!isUp && !isDown)) return 'neutral';
    return isUp === (trendTone !== 'positive-down') ? 'good' : 'bad';
  });
  const trendAria = $derived(
    trendLabel === null ? undefined
      : trendTone && verdict !== 'neutral'
        ? t().kpiCard.trendJudged(trendLabel, verdict === 'good')
        : t().kpiCard.trend(trendLabel)
  );
</script>

<dl
  class="ca-stat {className}"
  data-size={size}
  data-align={align}
  data-skeleton={skeleton ? '' : undefined}
  aria-busy={skeleton ? 'true' : undefined}
>
  <dt class="ca-stat__label{k('title')}">{label}</dt>
  <dd class="ca-stat__value{k('value')}">
    {value}{#if unit}<span class="ca-stat__unit{k('unit')}">{unit}</span>{/if}
  </dd>
  {#if trendLabel}
    <dd
      class="ca-stat__trend{k('trend')}"
      class:ca-stat__trend--up={isUp}
      class:ca-stat__trend--down={isDown}
      class:ca-kpi__trend--up={kpi && isUp}
      class:ca-kpi__trend--down={kpi && isDown}
      data-tone={verdict}
      aria-label={trendAria}
    >
      {isUp ? '↑' : isDown ? '↓' : ''}{trendLabel}
    </dd>
  {/if}
  {#if hint}<dd class="ca-stat__hint">{hint}</dd>{/if}
</dl>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-stat {
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-1-5);
      margin: 0;
      padding: 0;
      min-width: 0;
      text-align: start;
      color: inherit;
    }
    .ca-stat[data-align='center'] { text-align: center; align-items: center; }
    .ca-stat[data-size='sm'] { --ca-stat-value-size: var(--ca-font-size-h5); }
    .ca-stat[data-size='md'] { --ca-stat-value-size: var(--ca-font-size-h3); }
    .ca-stat[data-size='lg'] { --ca-stat-value-size: var(--ca-font-size-h1); }

    .ca-stat__label {
      margin: 0;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      color: var(--ca-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--ca-overline-tracking);
      line-height: var(--ca-line-height-snug);
    }

    .ca-stat__value {
      display: flex;
      align-items: baseline;
      gap: var(--ca-space-1);
      margin: var(--ca-space-0-5) 0 0;
      white-space: nowrap;
      font-size: var(--ca-stat-value-size);
      font-family: var(--ca-font-display);
      font-weight: var(--ca-font-weight-heading);
      font-variant-numeric: tabular-nums;
      color: var(--ca-text-primary);
      line-height: 1;
      letter-spacing: var(--ca-heading-tracking);
    }
    .ca-stat[data-align='center'] .ca-stat__value { justify-content: center; }

    .ca-stat__unit {
      font-size: var(--ca-font-size-body2);
      font-family: var(--ca-font-sans);
      font-weight: var(--ca-font-weight-regular);
      letter-spacing: normal;
      color: var(--ca-text-secondary);
    }

    .ca-stat__trend {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-0-5);
      margin: 0;
      align-self: flex-start;
      font-size: var(--ca-font-size-micro);
      font-weight: var(--ca-font-weight-semibold);
      font-variant-numeric: tabular-nums;
      border-radius: var(--ca-radius-pill);
      padding: var(--ca-space-0-5) var(--ca-space-2);
    }
    .ca-stat[data-align='center'] .ca-stat__trend { align-self: center; }
    .ca-stat__trend[data-tone='good'] { color: var(--ca-semantic-success); background: color-mix(in oklab, var(--ca-semantic-success) 8%, transparent); }
    .ca-stat__trend[data-tone='bad']  { color: var(--ca-semantic-error);   background: color-mix(in oklab, var(--ca-semantic-error)   8%, transparent); }
    .ca-stat__trend[data-tone='neutral'] { color: inherit; }

    .ca-stat__hint {
      margin: 0;
      font-size: var(--ca-font-size-caption);
      color: var(--ca-text-hint);
      line-height: var(--ca-line-height-snug);
    }
}
</style>

<script lang="ts">
  import type { IconComponent } from '../../types.js';
  import Card from '../Card/Card.svelte';
  import Stat from '../Stat/Stat.svelte';

  interface Props {
    title:   string;
    value:   string | number;
    unit?:   string;
    trend?:  number;
    /** Lucide icon component; size and color are managed by KpiCard */
    icon?:   IconComponent;
    /** Loading placeholder: same size as the loaded card, announced as busy. */
    skeleton?: boolean;
    class?:  string;
  }

  let { title, value, unit, trend, icon: Icon, skeleton = false, class: className = '' }: Props = $props();

  // Apps target the documented `.ca-kpi__*` classes. Stat owns the markup, so they are added to its
  // parts here (tracking the props) instead of widening Stat's API.
  const LEGACY: [string, string][] = [
    ['.ca-stat__label', 'ca-kpi__title'],
    ['.ca-stat__value', 'ca-kpi__value'],
    ['.ca-stat__unit', 'ca-kpi__unit'],
    ['.ca-stat__trend', 'ca-kpi__trend'],
    ['.ca-stat__trend--up', 'ca-kpi__trend--up'],
    ['.ca-stat__trend--down', 'ca-kpi__trend--down'],
  ];
  let inner: HTMLElement | undefined = $state();
  $effect(() => {
    // Re-run when anything Stat renders from changes.
    void [title, value, unit, trend];
    if (!inner) return;
    for (const [from, to] of LEGACY)
      for (const el of inner.querySelectorAll(from)) el.classList.add(to);
  });
</script>

<!-- A KpiCard is a Stat inside a Card: the label, number and trend typography come from Stat. -->
<Card elevation={3} class="ca-kpi {className}" {skeleton}>
  <div class="ca-kpi__inner" bind:this={inner}>
    <Stat label={title} {value} {unit} {trend} />
    {#if Icon}
      <span class="ca-kpi__icon" aria-hidden="true">
        <Icon size={16} stroke-width={1.75} />
      </span>
    {/if}
  </div>
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
    .ca-kpi__inner:has(.ca-kpi__icon) :global(.ca-stat__label) {
      padding-inline-end: var(--ca-space-6);
    }
}
</style>

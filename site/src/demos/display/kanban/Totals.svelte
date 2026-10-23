<script lang="ts">
  import { Kanban, type KanbanColumn } from '@codeatlasdev/ui';

  type Deal = { id: string; name: string; value: number };
  const deals = (prefix: string, values: number[]): Deal[] =>
    values.map((value, i) => ({ id: `${prefix}${i}`, name: `${prefix.toUpperCase()} deal ${i + 1}`, value }));

  let columns = $state<KanbanColumn<Deal>[]>([
    { id: 'new', label: 'New', color: 'var(--ca-info-main)', items: deals('n', [1200, 3400, 800]) },
    { id: 'talking', label: 'Talking', color: 'var(--ca-warning-main)', items: deals('t', [9800, 15000]) },
    { id: 'won', label: 'Won', color: 'var(--ca-success-main)', items: deals('w', [22000]) },
  ]);

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const sum = (c: KanbanColumn<Deal>) => money.format(c.items.reduce((acc, d) => acc + d.value, 0));
</script>

<div class="kb-totals">
  <Kanban
    {columns}
    getId={(d) => d.id}
    label="Deals pipeline"
    onmove={({ card, from, to }) => {
      const src = columns.find((c) => c.id === from.column);
      const dst = columns.find((c) => c.id === to.column);
      if (!src || !dst) return;
      src.items = src.items.filter((d) => d.id !== card.id);
      dst.items = [card, ...dst.items];
    }}
  >
    {#snippet card(deal)}
      <strong class="kb-totals__name">{deal.name}</strong>
      <span class="kb-totals__value">{money.format(deal.value)}</span>
    {/snippet}
    {#snippet summary(column)}
      {sum(column)}
    {/snippet}
  </Kanban>
</div>

<style>
  .kb-totals { display: flex; height: 22rem; }
  .kb-totals__name { display: block; font-size: var(--ca-font-size-body2); color: var(--ca-text-primary); }
  .kb-totals__value { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
</style>

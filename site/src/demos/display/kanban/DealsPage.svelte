<script lang="ts">
  import { Button, Kanban, PageShell, type KanbanColumn, type KanbanMove } from '@codeatlasdev/ui';
  import { Plus } from '@lucide/svelte';

  const m = {
    title: 'Deals',
    description: 'Drag a deal to the next stage.',
    add: 'New deal',
    board: 'Deals pipeline',
    stages: { new: 'New', talking: 'Talking', won: 'Won' },
  };

  type Deal = { id: string; name: string; company: string; value: number };

  let columns = $state<KanbanColumn<Deal>[]>([
    {
      id: 'new', label: m.stages.new, color: 'var(--ca-info-main)',
      items: [
        { id: 'd1', name: 'Website rebuild', company: 'Atlas Co', value: 12000 },
        { id: 'd2', name: 'Support plan', company: 'Bluebird', value: 3400 },
      ],
    },
    {
      id: 'talking', label: m.stages.talking, color: 'var(--ca-warning-main)',
      items: [{ id: 'd3', name: 'Data migration', company: 'Cedar Labs', value: 18500 }],
    },
    {
      id: 'won', label: m.stages.won, color: 'var(--ca-success-main)',
      items: [{ id: 'd4', name: 'Annual license', company: 'Delta Foods', value: 24000 }],
    },
  ]);

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const sum = (c: KanbanColumn<Deal>) => money.format(c.items.reduce((acc, d) => acc + d.value, 0));
  const count = $derived(columns.reduce((n, c) => n + c.items.length, 0));

  // The server orders each column newest first: a drop never picks a position (`drop="container"`).
  function onmove({ card, from, to }: KanbanMove<Deal>) {
    const src = columns.find((c) => c.id === from.column);
    const dst = columns.find((c) => c.id === to.column);
    if (!src || !dst) return;
    src.items = src.items.filter((d) => d.id !== card.id);
    dst.items = [card, ...dst.items];
  }
</script>

<div class="deals-stage">
  <PageShell title={m.title} description={m.description} {count}>
    {#snippet actions()}
      <Button variant="filled" size="sm">
        {#snippet leading()}<Plus size={14} />{/snippet}
        {m.add}
      </Button>
    {/snippet}

    <div class="deals-board">
      <Kanban {columns} getId={(d) => d.id} label={m.board} {onmove}>
        {#snippet card(deal)}
          <strong class="deals-name">{deal.name}</strong>
          <span class="deals-meta">{deal.company}</span>
          <span class="deals-meta">{money.format(deal.value)}</span>
        {/snippet}
        {#snippet summary(column)}
          {sum(column)}
        {/snippet}
      </Kanban>
    </div>
  </PageShell>
</div>

<style>
  /* Demo frame only: in a route the shell already fills the page. */
  .deals-stage {
    --ca-vh: 30rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 30rem;
    contain: layout paint;
    overflow: hidden;
    border-radius: var(--ca-radius-lg);
    box-shadow: inset 0 0 0 1px var(--ca-outline-subtle);
  }
  /* The board needs a parent with a height: its column lists scroll on their own. */
  .deals-board { display: flex; height: 22rem; }
  .deals-name { display: block; font-size: var(--ca-font-size-body2); color: var(--ca-text-primary); }
  .deals-meta { display: block; font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
</style>

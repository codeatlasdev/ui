<script lang="ts">
  import { Kanban, type KanbanColumn, type KanbanMove } from '@codeatlasdev/ui';

  type Lead = { id: string; name: string; company: string };
  const mk = (prefix: string, n: number): Lead[] =>
    Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix.toUpperCase()} lead ${i + 1}`, company: 'Atlas Co' }));

  let columns = $state<KanbanColumn<Lead>[]>([
    { id: 'new', label: 'New', color: 'var(--ca-info-main)', total: 24, hasMore: true, items: mk('n', 8) },
    { id: 'talking', label: 'Talking', color: 'var(--ca-warning-main)', items: mk('t', 3) },
    { id: 'won', label: 'Won', color: 'var(--ca-success-main)', items: [] },
  ]);

  function onmove({ card, from, to }: KanbanMove<Lead>) {
    const src = columns.find((c) => c.id === from.column);
    const dst = columns.find((c) => c.id === to.column);
    if (!src || !dst) return;
    src.items = src.items.filter((l) => l.id !== card.id);
    // The server orders each column newest first: a drop never picks a position.
    dst.items = [card, ...dst.items];
    if (src.total !== undefined) src.total -= 1;
    if (dst.total !== undefined) dst.total += 1;
  }

  function onloadmore(id: string) {
    const col = columns.find((c) => c.id === id);
    if (!col || col.loadingMore) return;
    col.loadingMore = true;
    setTimeout(() => {
      col.items = [...col.items, ...mk(`${id}p${col.items.length}`, 8)];
      col.loadingMore = false;
      col.hasMore = col.items.length < (col.total ?? 0);
    }, 600);
  }
</script>

<Kanban class="kb-demo" {columns} getId={(l) => l.id} {onmove} {onloadmore} label="Leads pipeline">
  {#snippet card(lead)}
    <strong class="kb-demo__name">{lead.name}</strong>
    <span class="kb-demo__company">{lead.company}</span>
  {/snippet}
  {#snippet empty(column, { canMove })}
    {canMove ? `Drop a lead here to win it` : `Nothing in ${column.label}`}
  {/snippet}
</Kanban>

<style>
  :global(.kb-demo) { height: 28rem; }
  .kb-demo__name { display: block; font-size: var(--ca-font-size-body2); color: var(--ca-text-primary); }
  .kb-demo__company { font-size: var(--ca-font-size-caption); color: var(--ca-text-secondary); }
</style>

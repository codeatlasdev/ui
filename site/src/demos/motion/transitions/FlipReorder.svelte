<script lang="ts">
  import { Button, MotionStage, type MotionCtx } from '@codeatlasdev/ui';
  import { tick } from 'svelte';

  type Row = { id: string; name: string; mrr: number; churn: number };
  const rows: Row[] = [
    { id: 'a', name: 'Northwind', mrr: 4820, churn: 1.2 },
    { id: 'b', name: 'Globex', mrr: 9310, churn: 3.4 },
    { id: 'c', name: 'Initech', mrr: 2150, churn: 0.8 },
    { id: 'd', name: 'Umbrella', mrr: 6740, churn: 2.1 },
    { id: 'e', name: 'Hooli', mrr: 12480, churn: 4.6 },
  ];
  const sorts = {
    mrr: { label: 'MRR', cmp: (x: Row, y: Row) => y.mrr - x.mrr },
    churn: { label: 'Churn', cmp: (x: Row, y: Row) => x.churn - y.churn },
  } as const;
  type SortKey = keyof typeof sorts;

  let sort = $state<SortKey>('mrr');
  let list = $state<HTMLElement>();
  let stage = $state<MotionCtx>();
  let lastCycle = -1;
  const ordered = $derived([...rows].sort(sorts[sort].cmp));

  // FLIP: First (measure every row), Last (let Svelte reorder the DOM), Invert (translate each row
  // back to where it was), Play (transition the translate to zero).
  async function reorder(next: SortKey) {
    if (next === sort) return;
    const root = list;
    const reduced = stage?.reduced ?? false;
    const first = new Map<string, number>();
    if (root && !reduced) for (const el of root.querySelectorAll<HTMLElement>('[data-id]')) first.set(el.dataset.id!, el.getBoundingClientRect().top);
    sort = next;
    await tick();
    if (!root || reduced) return;
    for (const el of root.querySelectorAll<HTMLElement>('[data-id]')) {
      const dy = (first.get(el.dataset.id!) ?? 0) - el.getBoundingClientRect().top;
      if (!dy) continue;
      el.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
        { duration: 420, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
      );
    }
  }

  $effect(() => {
    if (!stage) return;
    if (stage.reduced) {
      sort = 'churn';
      return;
    }
    if (!stage.playing || stage.cycle === lastCycle) return;
    lastCycle = stage.cycle;
    void reorder(sort === 'mrr' ? 'churn' : 'mrr');
  });
</script>

<MotionStage label="FLIP reorder: rows slide to their new place when the sort changes" loop={2400}>
  {#snippet children(m)}
    <div class="fl" {@attach () => { stage = m; }}>
      <div class="fl__bar" role="group" aria-label="Sort customers by">
        {#each Object.entries(sorts) as [key, s] (key)}
          <Button size="sm" variant={sort === key ? 'filled' : 'outlined'} aria-pressed={sort === key} onclick={() => reorder(key as SortKey)}>{s.label}</Button>
        {/each}
      </div>
      <ul class="fl__list" bind:this={list}>
        {#each ordered as r (r.id)}
          <li class="fl__row" data-id={r.id}>
            <span class="fl__name">{r.name}</span>
            <span class="fl__num">{sort === 'mrr' ? `R$ ${r.mrr.toLocaleString('pt-BR')}` : `${r.churn.toFixed(1)}% churn`}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/snippet}
</MotionStage>

<style>
  .fl { width: 100%; max-width: 340px; display: grid; gap: var(--ca-space-3); }
  .fl__bar { display: flex; gap: var(--ca-space-2); }
  .fl__list { display: grid; gap: var(--ca-space-2); margin: 0; padding: 0; list-style: none; }
  .fl__row {
    display: flex; justify-content: space-between; gap: var(--ca-space-3);
    padding: var(--ca-space-2-5) var(--ca-space-3);
    background: var(--ca-surface-raised); border: var(--ca-border-width) solid var(--ca-outline-subtle);
    border-radius: var(--ca-radius-md);
  }
  .fl__name { font-weight: var(--ca-font-weight-semibold); }
  .fl__num { color: var(--ca-text-secondary); font-variant-numeric: tabular-nums; }
</style>

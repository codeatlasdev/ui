<script lang="ts">
  import { EmptyState, MasterDetail } from '@codeatlasdev/ui';

  const threads = [
    { id: 'maria', name: 'Maria Souza', last: 'The report is attached.' },
    { id: 'joao', name: 'João Lima', last: 'Deal, thanks.' },
    { id: 'ana', name: 'Ana Costa', last: 'Can you review it today?' },
  ];
  let selected = $state<string | null>(null);
  const current = $derived(threads.find((t) => t.id === selected));
</script>

<div class="frame">
  <MasterDetail bind:selected detailTitle={current?.name ?? ''} listWidth="16rem">
    {#snippet master()}
      <ul class="list">
        {#each threads as t (t.id)}
          <li>
            <button type="button" class="row" aria-current={selected === t.id ? 'true' : undefined} onclick={() => (selected = t.id)}>
              <strong>{t.name}</strong>
              <span>{t.last}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/snippet}
    {#snippet detail()}
      <div class="thread"><p>{current?.last}</p></div>
    {/snippet}
    {#snippet empty()}
      <EmptyState title="Select a conversation" />
    {/snippet}
  </MasterDetail>
</div>

<style>
  .frame { height: 22rem; border: var(--ca-border-width) solid var(--ca-outline-subtle); border-radius: var(--ca-radius-lg); overflow: hidden; }
  .list { list-style: none; margin: 0; padding: 0; }
  .row { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ca-space-0-5); width: 100%; padding: var(--ca-space-3) var(--ca-space-4); background: none; border: 0; color: inherit; text-align: start; cursor: pointer; }
  .row[aria-current='true'] { background: var(--ca-surface-raised); }
  .row span { color: var(--ca-text-secondary); font-size: var(--ca-font-size-body2); }
  .thread { padding: var(--ca-space-4); }
</style>

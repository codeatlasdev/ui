<script lang="ts">
  import DndLayer from '../components/DragAndDrop/DndLayer.svelte';
  import { applyMove, type DndDropEvent } from './dnd.js';
  import { useDnd } from './dnd.svelte.js';

  let {
    initial = { a: ['a1', 'a2', 'a3'], b: ['b1', 'b2'] },
    drops = [],
    zone = false,
    handle = false,
    container = false,
    scroller = false,
  }: {
    initial?: Record<string, string[]>;
    drops?: DndDropEvent[];
    zone?: boolean;
    handle?: boolean;
    /** `drop: "container"` on every list. */
    container?: boolean;
    /** Wrap the lists in a horizontally scrolling `dnd.scroller` board. */
    scroller?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let lists = $state<Record<string, string[]>>(structuredClone(initial));
  const dnd = useDnd({ holdMs: 120 });

  function onDrop(e: DndDropEvent) {
    drops.push(e);
    lists = applyMove(lists, e, (s) => s);
  }
</script>

<DndLayer {dnd} />
<div class="board" class:scrolling={scroller} data-testid="board" {@attach dnd.scroller(() => ({ axis: 'x', disabled: !scroller }))}>
  {#each Object.keys(lists) as id (id)}
    <ul
      aria-label="List {id}"
      class="col"
      {@attach dnd.sortable(() => ({ id, group: 'board', label: `List ${id}`, handle: handle ? '.grip' : undefined, drop: container ? 'container' : 'position', getItems: () => lists[id], onDrop }))}
    >
      {#each lists[id] as item (item)}
        <li data-dnd-item={item} class="row">
          <button class="grip" aria-label="Move {item}" aria-describedby={dnd.instructionsId}>{item}</button>
        </li>
      {/each}
    </ul>
  {/each}
  {#if zone}
    <div class="trash" aria-label="Trash" role="group" {@attach dnd.dropzone(() => ({ id: 'trash', label: 'Trash', onDrop: (e) => { drops.push(e); lists = { ...lists, [e.from.container]: lists[e.from.container].filter((x) => x !== e.id) }; } }))}>Trash</div>
  {/if}
</div>
<output data-testid="order">{Object.entries(lists).map(([k, v]) => `${k}:${v.join(',')}`).join(' | ')}</output>

<style>
  .board { display: flex; gap: 24px; padding: 8px; }
  .col { flex: none; list-style: none; margin: 0; padding: 8px; width: 160px; min-height: 160px; border: 1px solid var(--ca-outline-subtle); }
  .row { height: 40px; margin: 0 0 8px; border: 1px solid var(--ca-outline-subtle); }
  .grip { all: unset; display: block; width: 100%; height: 100%; cursor: grab; }
  .grip:focus-visible { outline: 2px solid var(--ca-focus-ring); }
  .board.scrolling { width: 420px; overflow-x: auto; }
  .trash { width: 120px; height: 120px; border: 1px dashed var(--ca-outline-strong); }
</style>

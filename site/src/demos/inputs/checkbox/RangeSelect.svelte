<script lang="ts">
  import { Checkbox } from '@codeatlasdev/ui';

  const rows = ['Invoice 101', 'Invoice 102', 'Invoice 103', 'Invoice 104', 'Invoice 105'];
  let selected = $state<boolean[]>(rows.map(() => false));
  let anchor = -1;
  let shift = false;

  function toggle(index: number, on: boolean) {
    if (shift && anchor >= 0) {
      const [from, to] = anchor < index ? [anchor, index] : [index, anchor];
      for (let i = from; i <= to; i++) selected[i] = on;
    } else {
      selected[index] = on;
    }
    anchor = index;
  }
</script>

<ul class="list">
  {#each rows as row, i (row)}
    <li>
      <Checkbox
        label={row}
        checked={selected[i]}
        data-testid="row-{i}"
        onclick={(e) => (shift = e.shiftKey)}
        onchange={(on) => toggle(i, on)}
      />
    </li>
  {/each}
</ul>
<p class="out">{selected.filter(Boolean).length} selected. Shift+click extends the range.</p>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: var(--ca-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .out {
    margin: var(--ca-space-3) 0 0;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
  }
</style>

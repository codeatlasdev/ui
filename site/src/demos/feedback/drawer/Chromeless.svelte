<script lang="ts">
  import { Drawer, Button } from '@codeatlasdev/ui';
  import { X } from '@lucide/svelte';

  let open = $state(false);
</script>

<Button variant="outlined" onclick={() => (open = true)}>Open detail</Button>

<!-- chromeless: no header, no padding. The view brings its own header and scroll area. -->
<Drawer bind:open chromeless width="26rem" fullBleedBelow="sm" aria-labelledby="detail-title">
  <div class="detail">
    <header class="head">
      <h2 id="detail-title" class="name">Order 1042</h2>
      <Button variant="ghost" size="sm" aria-label="Close detail" onclick={() => (open = false)}>
        {#snippet leading()}<X size={14} />{/snippet}
      </Button>
    </header>
    <div class="scroll">
      {#each Array.from({ length: 24 }, (_, i) => i + 1) as n (n)}
        <p class="row">Line item {n}</p>
      {/each}
    </div>
  </div>
</Drawer>

<style>
  .detail { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: var(--ca-space-3); padding: var(--ca-space-3) var(--ca-space-4); box-shadow: inset 0 -1px 0 var(--ca-outline-subtle); }
  .name { margin: 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-primary); }
  .scroll { flex: 1; min-height: 0; overflow-y: auto; padding: var(--ca-space-4); }
  .row { margin: 0 0 var(--ca-space-3); font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import { Drawer, Button } from '@codeatlasdev/ui';
  import { X } from '@lucide/svelte';

  let open = $state(false);
</script>

<Button variant="outlined" onclick={() => (open = true)}>Open item</Button>

<!-- No `title`: aria-labelledby points at the drawer's own heading. -->
<Drawer bind:open aria-labelledby="item-heading" data-testid="item-drawer">
  <header class="head">
    <div>
      <p class="key">PRJ-42</p>
      <h2 id="item-heading" class="name">Fix login redirect</h2>
    </div>
    <Button variant="ghost" size="sm" aria-label="Close item" onclick={() => (open = false)}>
      {#snippet leading()}<X size={14} />{/snippet}
    </Button>
  </header>
  <p class="body">Own header, own close button. The panel is still named by the heading above.</p>
</Drawer>

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .key { margin: 0; font-size: 12px; color: var(--ca-text-secondary); letter-spacing: 0.05em; }
  .name { margin: 2px 0 0; font-size: var(--ca-font-size-body1); color: var(--ca-text-primary); }
  .body { margin: 16px 0 0; font-size: var(--ca-font-size-body2); color: var(--ca-text-secondary); }
</style>

<script lang="ts">
  import { Button, Stack, VirtualList } from '@codeatlasdev/ui';

  type Msg = { id: number; text: string };
  let oldest = 5000;
  let items = $state<Msg[]>(Array.from({ length: 40 }, (_, i) => ({ id: oldest + i, text: `Message ${oldest + i}` })));
  let loading = $state(false);
  let hasMore = $state(true);

  async function loadOlder() {
    loading = true;
    await new Promise((r) => setTimeout(r, 400));
    const page = Array.from({ length: 30 }, (_, i) => ({ id: oldest - 30 + i, text: `Message ${oldest - 30 + i}` }));
    oldest -= 30;
    items = [...page, ...items];
    hasMore = oldest > 4850;
    loading = false;
  }
  const add = () => items.push({ id: items.at(-1)!.id + 1, text: `Message ${items.at(-1)!.id + 1}` });
</script>

<Stack gap="3">
  <VirtualList {items} getKey={(m) => m.id} label="Conversation" height="18rem" {hasMore} loadingMore={loading} onloadmore={loadOlder}>
    {#snippet item(m)}<div class="row">{m.text}</div>{/snippet}
  </VirtualList>
  <Button size="sm" variant="outlined" onclick={add}>Receive a message</Button>
</Stack>

<style>
  .row { padding: var(--ca-space-2) var(--ca-space-3); }
</style>

<script lang="ts">
  import { ScrollArea, Card } from '@codeatlasdev/ui';

  const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}: Lorem ipsum dolor sit amet`);
</script>

<Card material="glass" full>
  <ScrollArea maxHeight="220px">
    {#each items as item}
      <div class="item">{item}</div>
    {/each}
  </ScrollArea>
</Card>

<style>
  .item {
    padding: 10px 16px;
    font-size: var(--ca-font-size-body2);
    color: var(--ca-text-secondary);
    border-bottom: 1px solid var(--ca-outline-subtle);
  }
  .item:last-child { border-bottom: none; }
</style>
